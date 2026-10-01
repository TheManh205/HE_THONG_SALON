from typing import List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, RoleEnum
from app.schemas.analytics import (
    RevenueStatsResponse,
    DateRangeRevenueResponse,
    StylistPerformanceResponse,
    PopularServiceItem,
    ReturningCustomersResponse,
    DashboardOverview,
)
from app.services.analytics_service import AnalyticsService
from app.services.auth_service import require_roles

router = APIRouter(prefix="/analytics", tags=["Reports & Analytics"])


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Get high-level summary overview metrics."""
    return AnalyticsService.get_dashboard_overview(db)

@router.get("/revenue", response_model=RevenueStatsResponse)
def get_revenue_statistics(
    days: int = Query(7, ge=1, le=90, description="Số ngày cần thống kê"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Get daily revenue breakdown and average order value (Admin only)."""
    return AnalyticsService.get_revenue_stats(db, days=days)

@router.get("/popular-services", response_model=List[PopularServiceItem])
def get_popular_services(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Get most popular booked services with revenue share."""
    return AnalyticsService.get_popular_services(db, limit=limit)

@router.get("/customer-retention", response_model=ReturningCustomersResponse)
def get_customer_retention(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Calculate customer return and retention rates."""
    return AnalyticsService.get_customer_retention(db)


@router.get("/revenue-range", response_model=DateRangeRevenueResponse)
def get_revenue_by_range(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Get revenue breakdown for custom date range A -> B."""
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date.")

    return AnalyticsService.get_revenue_by_date_range(db, start_date=start_dt, end_date=end_dt)


@router.get("/stylist-performance", response_model=StylistPerformanceResponse)
def get_stylist_performance(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([RoleEnum.ADMIN, RoleEnum.RECEPTIONIST]))
):
    """Get stylist performance metrics within date range A -> B."""
    try:
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date.")

    return AnalyticsService.get_stylist_performance(db, start_date=start_dt, end_date=end_dt)

