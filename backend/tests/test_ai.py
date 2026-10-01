import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_public_ai_recommendation_success():
    response = client.post("/api/v1/ai/recommend", json={
        "customer_name": "Test User",
        "gender": "Female",
        "hair_condition": "Tóc khô xơ",
        "desired_style": "Nhuộm và phục hồi"
    })
    assert response.status_code == 200
    data = response.json()
    assert "styling_advice" in data
    assert "recommended_services" in data
    assert "home_care_tips" in data

def test_public_ai_recommendation_forbidden_with_customer_id():
    response = client.post("/api/v1/ai/recommend", json={
        "customer_id": 1,
        "customer_name": "Test User"
    })
    assert response.status_code == 403
    assert response.json()["detail"] == "Không được phép truy cập lịch sử khách hàng nếu chưa đăng nhập."

def test_ai_care_message_unauthorized():
    response = client.post("/api/v1/ai/generate-care-message", json={
        "customer_name": "Test User",
        "message_type": "REMINDER"
    })
    assert response.status_code == 401

def test_ai_summary_unauthorized():
    response = client.post("/api/v1/ai/summarize-history", json={
        "customer_id": 1
    })
    assert response.status_code == 401
