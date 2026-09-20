from datetime import datetime, timedelta
from fastapi.testclient import TestClient

def test_services_catalog_public(client: TestClient):
    res = client.get("/api/v1/services/")
    assert res.status_code == 200
    services = res.json()
    assert len(services) >= 2

def test_create_service_admin(client: TestClient, admin_token: str):
    payload = {
        "name": "Dịch vụ Nhuộm Khói Đặc Biệt",
        "description": "Nhuộm cao cấp",
        "duration_minutes": 90,
        "price": 800000,
        "category": "Nhuộm màu & Tẩy"
    }
    res = client.post(
        "/api/v1/services/",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Dịch vụ Nhuộm Khói Đặc Biệt"

def test_invoice_creation_and_service_history(client: TestClient, receptionist_token: str):
    # Book an appointment
    target_dt = datetime.now() + timedelta(days=2)
    target_time = target_dt.replace(hour=11, minute=0, second=0, microsecond=0)
    
    # Create appointment
    app_res = client.post("/api/v1/appointments/book", json={
        "customer_name": "Nguyễn Văn Hóa Đơn",
        "customer_phone": "0933445566",
        "hairdresser_id": 1,
        "appointment_date": target_time.isoformat(),
        "service_ids": [1],
        "notes": "Cắt tóc xong tính tiền"
    })
    assert app_res.status_code == 201
    app_data = app_res.json()
    app_id = app_data["id"]
    cust_id = app_data["customer_id"]

    # Checkout & create invoice
    inv_payload = {
        "appointment_id": app_id,
        "discount_amount": 20000,
        "payment_method": "CASH",
        "payment_status": "PAID",
        "formula_or_color_code": "Cắt fade 0.5mm, sấy tạo nếp tự nhiên",
        "technician_notes": "Khách hài lòng"
    }
    inv_res = client.post(
        "/api/v1/invoices/",
        json=inv_payload,
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert inv_res.status_code == 201
    inv_data = inv_res.json()
    assert inv_data["final_amount"] == 130000 # 150000 - 20000

    # Check appointment status updated to COMPLETED
    app_check = client.get(
        f"/api/v1/appointments/{app_id}",
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert app_check.json()["status"] == "COMPLETED"

    # Check customer history
    hist_res = client.get(
        f"/api/v1/customers/{cust_id}/history",
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert hist_res.status_code == 200
    hist_list = hist_res.json()
    assert len(hist_list) == 1
    assert "Cắt tóc Layer" in hist_list[0]["service_names"]
