from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
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
