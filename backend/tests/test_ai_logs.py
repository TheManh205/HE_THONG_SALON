import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.ai_log import AILog
from app.core.config import settings

def test_ai_logs_recommendation_success_or_fallback(client: TestClient, db_session: Session):
    # This will trigger a fallback or success depending on if Gemini key is available.
    payload = {
        "customer_name": "Test User",
        "gender": "Female",
        "hair_condition": "Khô",
        "desired_style": "Phục hồi"
    }
    res = client.post("/api/v1/ai/recommend", json=payload)
    assert res.status_code == 200

    # Query the database for the log
    log = db_session.query(AILog).order_by(AILog.id.desc()).first()
    assert log is not None
    assert log.request_type == "recommend"
    assert log.status in ["SUCCESS", "FALLBACK"]

    # Assert no tokens/keys are in the log
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if api_key:
        assert api_key not in str(log.prompt_details)
        assert api_key not in str(log.response_details)

    # Nullable user_id, customer_id
    assert log.user_id is None
    assert log.customer_id is None

def test_ai_logs_care_message_error_or_fallback(client: TestClient, receptionist_token: str, db_session: Session):
    payload = {
        "customer_name": "Anh Hoàng",
        "message_type": "UNKNOWN_TYPE",
        "service_names": "Cắt Tóc",
        "appointment_time": "15:00"
    }
    # For care message, it uses smart fallback or success.
    res = client.post(
        "/api/v1/ai/generate-care-message",
        json=payload,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert res.status_code == 200

    log = db_session.query(AILog).order_by(AILog.id.desc()).first()
    assert log is not None
    assert log.request_type == "care_message"
    assert log.status in ["SUCCESS", "FALLBACK", "ERROR"]
    assert log.user_id is not None # Receptionist token provides user_id
    assert log.customer_id is None

def test_ai_logs_summary_unauthorized_does_not_log(client: TestClient, db_session: Session):
    # Before
    count_before = db_session.query(AILog).count()

    # 401 Unauthorized
    res = client.post("/api/v1/ai/summarize-history", json={"customer_id": 999})
    assert res.status_code == 401

    # After
    count_after = db_session.query(AILog).count()
    assert count_before == count_after


from unittest.mock import patch
from app.services.ai_service import AIService

def test_ai_logs_security_no_sensitive_data(client: TestClient, receptionist_token: str, db_session: Session):
    authorization = "Bearer " + receptionist_token
    fake_password = "SuperSecretPassword123!"

    payload = {
        "customer_name": "Secure Test",
        "message_type": "REMINDER",
        "password": fake_password # injecting dummy sensitive data
    }

    res = client.post(
        "/api/v1/ai/generate-care-message",
        json=payload,
        headers={"Authorization": authorization}
    )
    assert res.status_code == 200

    log = db_session.query(AILog).order_by(AILog.id.desc()).first()
    assert log is not None

    prompt_str = str(log.prompt_details)
    resp_str = str(log.response_details)
    err_str = str(log.error_message)

    # Check that fake credentials are NOT in the logs
    assert receptionist_token not in prompt_str
    assert receptionist_token not in resp_str
    assert receptionist_token not in err_str

    assert authorization not in prompt_str
    assert authorization not in resp_str
    assert authorization not in err_str

    assert fake_password not in prompt_str
    assert fake_password not in resp_str
    assert fake_password not in err_str


@patch('app.services.ai_service.AIService._get_gemini_client')
@patch('app.services.ai_service.AIService._generate_with_retry')
def test_ai_logs_fallback_semantics_on_json_error(mock_generate, mock_get_client, client: TestClient, db_session: Session):
    # Ensure client is not None so it calls _generate_with_retry
    mock_get_client.return_value = "fake_client"
    # Simulate Gemini returning invalid JSON (CASE B)
    mock_generate.return_value = "This is not a JSON, it is a plain text response causing parse error."

    payload = {
        "customer_name": "Test User",
        "gender": "Female",
        "hair_condition": "Khô",
        "desired_style": "Phục hồi"
    }
    res = client.post("/api/v1/ai/recommend", json=payload)
    assert res.status_code == 200

    log = db_session.query(AILog).order_by(AILog.id.desc()).first()
    assert log is not None
    # Ensure it's the log we just created by checking request_type
    assert log.request_type == "recommend"
    # Because JSON parsing fails, fallback is used, so status should be FALLBACK
    assert log.status == "FALLBACK"
