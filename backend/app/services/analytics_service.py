from datetime import datetime, timedelta, timezone, date as DateType
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.models.invoice import Invoice, PaymentStatus
from app.models.appointment import Appointment, AppointmentStatus
from app.models.service import Service, AppointmentService
from app.models.customer import Customer
from app.models.hairdresser import Hairdresser
from app.schemas.analytics import (
    DailyRevenue,
    RevenueStatsResponse,
    DateRangeRevenueResponse,
    StylistPerformanceItem,
    StylistPerformanceResponse,
    PopularServiceItem,
    ReturningCustomersResponse,
    DashboardOverview
)

class AnalyticsService:
    @staticmethod
    def get_revenue_stats(db: Session, days: int = 7) -> RevenueStatsResponse:
        """Calculate revenue trends, average order value, and daily breakdown."""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        invoices = db.query(Invoice).filter(
            Invoice.created_at >= start_date,
            Invoice.payment_status == PaymentStatus.PAID
        ).all()

        total_revenue = sum(inv.final_amount for inv in invoices)
        total_invoices = len(invoices)
        average_order_value = (total_revenue / total_invoices) if total_invoices > 0 else 0.0

        # Group by day
        daily_dict: Dict[str, Dict[str, Any]] = {}
        for i in range(days):
            day_dt = (start_date + timedelta(days=i)).date()
            date_str = day_dt.strftime("%Y-%m-%d")
            daily_dict[date_str] = {"revenue": 0.0, "count": 0}

        for inv in invoices:
            date_str = inv.created_at.strftime("%Y-%m-%d")
            if date_str in daily_dict:
                daily_dict[date_str]["revenue"] += inv.final_amount
                daily_dict[date_str]["count"] += 1

        daily_breakdown = [
            DailyRevenue(
                date=k,
                revenue=v["revenue"],
                appointment_count=v["count"]
            )
            for k, v in sorted(daily_dict.items())
        ]

        return RevenueStatsResponse(
            total_revenue=total_revenue,
            total_invoices=total_invoices,
            average_order_value=average_order_value,
            daily_breakdown=daily_breakdown
        )

    @staticmethod
    def get_popular_services(db: Session, limit: int = 5) -> List[PopularServiceItem]:
        """Aggregate most booked and highest revenue services."""
        results = db.query(
            Service.id,
            Service.name,
            Service.category,
            func.count(AppointmentService.id).label("booking_count"),
            func.sum(AppointmentService.price_at_booking).label("total_revenue")
        ).join(
            AppointmentService, Service.id == AppointmentService.service_id
        ).join(
            Appointment, AppointmentService.appointment_id == Appointment.id
        ).filter(
            Appointment.status != AppointmentStatus.CANCELLED
        ).group_by(
            Service.id, Service.name, Service.category
        ).order_by(
            func.count(AppointmentService.id).desc()
        ).limit(limit).all()

        popular_items = []
        for r in results:
            popular_items.append(PopularServiceItem(
                service_id=r[0],
                service_name=r[1],
                category=r[2],
                booking_count=r[3],
                total_revenue=float(r[4] or 0.0)
            ))

        return popular_items

    @staticmethod
    def get_customer_retention(db: Session) -> ReturningCustomersResponse:
        """Calculate total customers, returning customers (>1 appointment), and retention rate."""
        total_customers = db.query(Customer).count()
        
        # Subquery customers with > 1 completed or non-cancelled appointment
        customer_booking_counts = db.query(
            Appointment.customer_id,
            func.count(Appointment.id).label("cnt")
        ).filter(
            Appointment.status != AppointmentStatus.CANCELLED
        ).group_by(Appointment.customer_id).having(func.count(Appointment.id) > 1).all()

        returning_customers = len(customer_booking_counts)
        new_customers = max(0, total_customers - returning_customers)
        retention_rate = (returning_customers / total_customers * 100) if total_customers > 0 else 0.0

        return ReturningCustomersResponse(
            total_customers=total_customers,
            returning_customers=returning_customers,
            new_customers=new_customers,
            retention_rate_percentage=round(retention_rate, 2)
        )

    @staticmethod
    def get_revenue_by_date_range(
        db: Session,
        start_date: datetime,
        end_date: datetime
    ) -> DateRangeRevenueResponse:
        """Doanh thu tổng hợp theo khoảng ngày tùy chọn (A → B)."""
        # Normalize end_date to end of day
        end_of_day = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        invoices = db.query(Invoice).filter(
            Invoice.created_at >= start_date,
            Invoice.created_at <= end_of_day,
            Invoice.payment_status == PaymentStatus.PAID
        ).all()

        total_revenue = sum(inv.final_amount for inv in invoices)
        total_invoices = len(invoices)
        avg_order_value = (total_revenue / total_invoices) if total_invoices > 0 else 0.0

        # Build per-day dict spanning the full range
        daily_dict: Dict[str, Dict[str, Any]] = {}
        delta = (end_of_day.date() - start_date.date()).days + 1
        for i in range(delta):
            day_str = (start_date.date() + timedelta(days=i)).strftime("%Y-%m-%d")
            daily_dict[day_str] = {"revenue": 0.0, "count": 0}

        for inv in invoices:
            day_str = inv.created_at.strftime("%Y-%m-%d")
            if day_str in daily_dict:
                daily_dict[day_str]["revenue"] += inv.final_amount
                daily_dict[day_str]["count"] += 1

        daily_breakdown = [
            DailyRevenue(date=k, revenue=v["revenue"], appointment_count=v["count"])
            for k, v in sorted(daily_dict.items())
        ]

        return DateRangeRevenueResponse(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            total_revenue=total_revenue,
            total_invoices=total_invoices,
            average_order_value=avg_order_value,
            daily_breakdown=daily_breakdown,
        )

    @staticmethod
    def get_stylist_performance(
        db: Session,
        start_date: datetime,
        end_date: datetime
    ) -> StylistPerformanceResponse:
        """Doanh thu + số lượt phục vụ + hiệu suất của từng Stylist (only active)."""
        end_of_day = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)

        # Query 1: Total non-cancelled appointments per hairdresser
        total_appt_rows = db.query(
            Appointment.hairdresser_id,
            func.count(Appointment.id).label("total_appointments"),
        ).filter(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_of_day,
            Appointment.status != AppointmentStatus.CANCELLED,
        ).group_by(Appointment.hairdresser_id).all()

        # Query 2: Only COMPLETED appointments per hairdresser
        completed_appt_rows = db.query(
            Appointment.hairdresser_id,
            func.count(Appointment.id).label("completed_appointments"),
        ).filter(
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_of_day,
            Appointment.status == AppointmentStatus.COMPLETED,
        ).group_by(Appointment.hairdresser_id).all()

        total_map: Dict[int, int] = {r.hairdresser_id: r.total_appointments for r in total_appt_rows}
        completed_map: Dict[int, int] = {r.hairdresser_id: r.completed_appointments for r in completed_appt_rows}

        # Build lookup: hairdresser_id -> (total, completed)
        appt_map: Dict[int, Dict] = {
            hd_id: {
                "total": total_map.get(hd_id, 0),
                "completed": completed_map.get(hd_id, 0),
            }
            for hd_id in set(list(total_map.keys()) + list(completed_map.keys()))
        }

        # Aggregate revenue per hairdresser via invoice join
        revenue_rows = db.query(
            Appointment.hairdresser_id,
            func.coalesce(func.sum(Invoice.final_amount), 0.0).label("revenue")
        ).join(
            Invoice, Invoice.appointment_id == Appointment.id, isouter=True
        ).filter(
            Invoice.payment_status == PaymentStatus.PAID,
            Appointment.appointment_date >= start_date,
            Appointment.appointment_date <= end_of_day,
        ).group_by(Appointment.hairdresser_id).all()

        revenue_map: Dict[int, float] = {r.hairdresser_id: float(r.revenue) for r in revenue_rows}

        # Fetch all active hairdressers
        hairdressers = db.query(Hairdresser).filter(Hairdresser.is_active == True).all()

        stylists = []
        for hd in hairdressers:
            stats = appt_map.get(hd.id, {"total": 0, "completed": 0})
            stylists.append(StylistPerformanceItem(
                hairdresser_id=hd.id,
                hairdresser_name=hd.full_name,
                avatar_url=hd.avatar_url,
                total_revenue=revenue_map.get(hd.id, 0.0),
                total_appointments=stats["total"],
                completed_appointments=stats["completed"],
                average_rating=hd.rating,
            ))

        # Sort by revenue descending
        stylists.sort(key=lambda x: x.total_revenue, reverse=True)

        return StylistPerformanceResponse(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            stylists=stylists,
        )

    @staticmethod
    def get_dashboard_overview(db: Session) -> DashboardOverview:
        """Fetch high-level overview metrics for main dashboard."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        today_invoices = db.query(Invoice).filter(
            Invoice.created_at >= today_start,
            Invoice.created_at < today_end,
            Invoice.payment_status == PaymentStatus.PAID
        ).all()
        today_revenue = sum(inv.final_amount for inv in today_invoices)

        today_appointments = db.query(Appointment).filter(
            Appointment.appointment_date >= today_start,
            Appointment.appointment_date < today_end,
            Appointment.status != AppointmentStatus.CANCELLED
        ).count()

        pending_appointments = db.query(Appointment).filter(
            Appointment.status == AppointmentStatus.PENDING
        ).count()

        active_hairdressers = db.query(Hairdresser).filter(
            Hairdresser.is_active == True
        ).count()

        retention = AnalyticsService.get_customer_retention(db)

        return DashboardOverview(
            today_revenue=today_revenue,
            today_appointments=today_appointments,
            pending_appointments=pending_appointments,
            active_hairdressers=active_hairdressers,
            recent_invoices_total=today_revenue,
            retention_rate=retention.retention_rate_percentage
        )
