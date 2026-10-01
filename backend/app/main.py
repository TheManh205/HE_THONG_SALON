from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.utils.seed import seed_database
from app.routers import (
    auth_router,
    users_router,
    customers_router,
    hairdressers_router,
    services_router,
    appointments_router,
    invoices_router,
    payments_router,
    analytics_router,
    ai_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and seed default data
    print("[INIT] Initializing Salon Management & AI Database...")
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    print("[SHUTDOWN] Shutting down Salon Management Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Hệ thống Quản lý Đặt lịch Salon Tóc Tích hợp AI (FastAPI + SQLAlchemy + ReactJS + Gemini API)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4173",
        "http://127.0.0.1:4173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(customers_router, prefix=settings.API_V1_STR)
app.include_router(hairdressers_router, prefix=settings.API_V1_STR)
app.include_router(services_router, prefix=settings.API_V1_STR)
app.include_router(appointments_router, prefix=settings.API_V1_STR)
app.include_router(invoices_router, prefix=settings.API_V1_STR)
app.include_router(payments_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": f"Chào mừng đến với {settings.PROJECT_NAME} API!",
        "version": "1.0.0",
        "docs_url": "/docs",
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
