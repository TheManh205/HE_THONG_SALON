from fastapi.testclient import TestClient

def test_ai_recommendation_anti_hallucination(client: TestClient):
    payload = {
        "customer_name": "Chị Mai",
        "gender": "Female",
        "hair_condition": "Tóc khô xơ, chẻ ngọn",
        "desired_style": "Muốn uốn xoăn sóng nhẹ bồng bềnh và cắt tỉa gọn gàng",
        "budget_max": 1000000
    }
    res = client.post("/api/v1/ai/recommend", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "styling_advice" in data
    assert "recommended_services" in data
    assert len(data["recommended_services"]) > 0
    # Anti-hallucination check: ensure all recommended services have valid IDs and existing names from DB
    valid_ids = [1, 2] # from test seed
    for svc in data["recommended_services"]:
        assert svc["service_id"] in valid_ids
        assert svc["price"] > 0

def test_ai_care_message_generation(client: TestClient, receptionist_token: str):
    payload = {
        "customer_name": "Anh Hoàng",
        "message_type": "REMINDER",
        "service_names": "Cắt Tóc Nam Barber VIP",
        "appointment_time": "15:00 ngày mai"
    }
    res = client.post(
        "/api/v1/ai/generate-care-message",
        json=payload,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["message_type"] == "REMINDER"
    assert "Anh Hoàng" in data["message_content"]
    assert "Cắt Tóc Nam Barber VIP" in data["message_content"]

def test_ai_summary_history(client: TestClient, receptionist_token: str):
    res = client.post(
        "/api/v1/ai/summarize-history",
        json={"customer_id": 1},
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["customer_id"] == 1
    assert "Khách Hàng A" in data["customer_name"]
    assert "summary" in data
