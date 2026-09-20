from app.schemas.auth import Token, TokenPayload, LoginRequest
from app.schemas.user import UserCreate, UserUpdate, UserResponse, RoleResponse
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.schemas.hairdresser import HairdresserCreate, HairdresserUpdate, HairdresserResponse, ScheduleCreate, ScheduleResponse
from app.schemas.service import ServiceCreate, ServiceUpdate, ServiceResponse
from app.schemas.appointment import (
    AppointmentCreatePublic,
    AppointmentCreateAdmin,
    AppointmentUpdateStatus,
    AppointmentReschedule,
    OverlapCheckRequest,
    OverlapCheckResponse,
    AppointmentResponse,
    AppointmentServiceResponse
)
from app.schemas.invoice import InvoiceCreate, InvoiceResponse
from app.schemas.history import ServiceHistoryResponse
from app.schemas.analytics import (
    RevenueStatsResponse,
    PopularServiceItem,
    ReturningCustomersResponse,
    DashboardOverview
)
from app.schemas.ai import (
    AIRecommendationRequest,
    AIRecommendationResponse,
    AICareMessageRequest,
    AICareMessageResponse,
    AISummaryRequest,
    AISummaryResponse
)

__all__ = [
    "Token",
    "TokenPayload",
    "LoginRequest",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "RoleResponse",
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "HairdresserCreate",
    "HairdresserUpdate",
    "HairdresserResponse",
    "ScheduleCreate",
    "ScheduleResponse",
    "ServiceCreate",
    "ServiceUpdate",
    "ServiceResponse",
    "AppointmentCreatePublic",
    "AppointmentCreateAdmin",
    "AppointmentUpdateStatus",
    "AppointmentReschedule",
    "OverlapCheckRequest",
    "OverlapCheckResponse",
    "AppointmentResponse",
    "AppointmentServiceResponse",
    "InvoiceCreate",
    "InvoiceResponse",
    "ServiceHistoryResponse",
    "RevenueStatsResponse",
    "PopularServiceItem",
    "ReturningCustomersResponse",
    "DashboardOverview",
    "AIRecommendationRequest",
    "AIRecommendationResponse",
    "AICareMessageRequest",
    "AICareMessageResponse",
    "AISummaryRequest",
    "AISummaryResponse",
]
