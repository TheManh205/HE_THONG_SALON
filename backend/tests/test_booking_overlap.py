from datetime import datetime, timedelta
from fastapi.testclient import TestClient

def test_check_overlap_available_slot(client: TestClient):
    # Find next Tuesday (weekday=1)
    target_dt = datetime.now()
    days_ahead = (1 - target_dt.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    tuesday = target_dt + timedelta(days=days_ahead)
    tuesday_10am = tuesday.replace(hour=10, minute=0, second=0, microsecond=0)

    payload = {
        "hairdresser_id": 1,
        "appointment_date": tuesday_10am.isoformat(),
        "service_ids": [1] # 30 mins
    }
    response = client.post("/api/v1/appointments/check-overlap", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_available"] == True

def test_check_overlap_day_off(client: TestClient):
    # Find next Monday (weekday=0) which is day_off in test seed
    target_dt = datetime.now()
    days_ahead = (0 - target_dt.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    monday = target_dt + timedelta(days=days_ahead)
    monday_10am = monday.replace(hour=10, minute=0, second=0, microsecond=0)

    payload = {
        "hairdresser_id": 1,
        "appointment_date": monday_10am.isoformat(),
        "service_ids": [1]
    }
    response = client.post("/api/v1/appointments/check-overlap", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_available"] == False
    assert "nghỉ vào ngày này" in data["message"]

def test_public_booking_and_anti_overlap_prevention(client: TestClient):
    # Tuesday 14:00
    target_dt = datetime.now()
    days_ahead = (1 - target_dt.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    tuesday = target_dt + timedelta(days=days_ahead)
    tuesday_14pm = tuesday.replace(hour=14, minute=0, second=0, microsecond=0)

    # 1. First booking: 14:00 to 15:30 (Service 1 + Service 2 = 30 + 60 = 90 mins)
    book_payload = {
        "customer_name": "Trần Văn Test",
        "customer_phone": "0919998888",
        "customer_email": "test@gmail.com",
        "customer_gender": "Male",
        "hairdresser_id": 1,
        "appointment_date": tuesday_14pm.isoformat(),
        "service_ids": [1, 2],
        "notes": "Booking 1"
    }
    res1 = client.post("/api/v1/appointments/book", json=book_payload)
    assert res1.status_code == 201
    app1_data = res1.json()
    assert app1_data["total_price"] == 650000 # 150000 + 500000

    # 2. Second booking with overlapping slot: 14:30
    tuesday_14_30 = tuesday.replace(hour=14, minute=30, second=0, microsecond=0)
    conflict_payload = {
        "customer_name": "Lê Thị Trùng",
        "customer_phone": "0922223333",
        "hairdresser_id": 1,
        "appointment_date": tuesday_14_30.isoformat(),
        "service_ids": [1] # 30 mins
    }
    res2 = client.post("/api/v1/appointments/book", json=conflict_payload)
    assert res2.status_code == 409
    assert "đã có lịch hẹn khác trùng" in res2.json()["detail"]
