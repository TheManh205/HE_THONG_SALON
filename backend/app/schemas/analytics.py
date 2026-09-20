from typing import List, Optional
from pydantic import BaseModel

class DailyRevenue(BaseModel):
    date: str # YYYY-MM-DD
    revenue: float
    appointment_count: int

class RevenueStatsResponse(BaseModel):
    total_revenue: float
    total_invoices: int
    average_order_value: float
    daily_breakdown: List[DailyRevenue]

class PopularServiceItem(BaseModel):
    service_id: int
    service_name: str
    category: str
    booking_count: int
    total_revenue: float

class ReturningCustomersResponse(BaseModel):
    total_customers: int
    returning_customers: int
    new_customers: int
    retention_rate_percentage: float

class DashboardOverview(BaseModel):
    today_revenue: float
    today_appointments: int
    pending_appointments: int
    active_hairdressers: int
    recent_invoices_total: float
    retention_rate: float
