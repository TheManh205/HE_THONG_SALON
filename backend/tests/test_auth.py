from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "username": "test_admin",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"
    assert data["username"] == "test_admin"

def test_login_wrong_password(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "username": "test_admin",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "Tài khoản hoặc mật khẩu không chính xác" in response.json()["detail"]

def test_protected_route_without_token(client: TestClient):
    response = client.get("/api/v1/users/")
    assert response.status_code == 401

def test_admin_access_user_list(client: TestClient, admin_token: str):
    response = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_receptionist_forbidden_on_user_list(client: TestClient, receptionist_token: str):
    response = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert response.status_code == 403
