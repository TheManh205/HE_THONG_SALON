import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from datetime import datetime, timedelta, time
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.utils.seed import seed_database
from app.core.security import create_access_token
from app.models.user import User

# Use in-memory SQLite for super-fast, clean isolated tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    # Seed data
    db = TestingSessionLocal()
    # Mock seed on test db
    from app.models.user import Role, User
    from app.core.security import get_password_hash
    from app.models.hairdresser import Hairdresser, Schedule
    from app.models.service import Service
    from app.models.customer import Customer

    r_admin = Role(id=1, name="admin", description="Admin")
    r_rec = Role(id=2, name="receptionist", description="Receptionist")
    r_stylist = Role(id=3, name="hairdresser", description="Stylist")
    db.add_all([r_admin, r_rec, r_stylist])
    db.flush()

    admin_user = User(
        id=1,
        username="test_admin",
        email="admin@test.vn",
        hashed_password=get_password_hash("password123"),
        full_name="Test Admin",
        role_id=1,
        is_active=True
    )
    rec_user = User(
        id=2,
        username="test_rec",
        email="rec@test.vn",
        hashed_password=get_password_hash("password123"),
        full_name="Test Receptionist",
        role_id=2,
        is_active=True
    )
    db.add_all([admin_user, rec_user])
    db.flush()

    stylist = Hairdresser(
        id=1,
        full_name="Test Stylist Nam",
        phone="0911223344",
        is_active=True
    )
    db.add(stylist)
    db.flush()

    # Schedules: Mon-Sun (0 to 6) 8:30 to 20:00, off on Monday (0)
    for dow in range(7):
        s = Schedule(
            hairdresser_id=1,
            day_of_week=dow,
            start_time=time(8, 30),
            end_time=time(20, 0),
            is_day_off=(dow == 0)
        )
        db.add(s)

    # Services
    s1 = Service(id=1, name="Cắt tóc Layer", duration_minutes=30, price=150000, category="Cắt & Tạo kiểu", is_active=True)
    s2 = Service(id=2, name="Uốn sóng lơi", duration_minutes=60, price=500000, category="Uốn & Duỗi", is_active=True)
    db.add_all([s1, s2])

    # Customer
    c1 = Customer(id=1, full_name="Khách Hàng A", phone="0988888888", email="khach_a@gmail.com")
    db.add(c1)

    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token():
    return create_access_token(subject="1", role="admin")

@pytest.fixture
def receptionist_token():
    return create_access_token(subject="2", role="receptionist")
