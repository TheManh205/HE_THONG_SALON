from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.customers import router as customers_router
from app.routers.hairdressers import router as hairdressers_router
from app.routers.services import router as services_router
from app.routers.appointments import router as appointments_router
from app.routers.invoices import router as invoices_router
from app.routers.payments import router as payments_router
from app.routers.analytics import router as analytics_router
from app.routers.ai import router as ai_router

__all__ = [
    "auth_router",
    "users_router",
    "customers_router",
    "hairdressers_router",
    "services_router",
    "appointments_router",
    "invoices_router",
    "payments_router",
    "analytics_router",
    "ai_router",
]
