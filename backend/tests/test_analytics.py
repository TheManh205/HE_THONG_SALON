from datetime import datetime, timedelta
from fastapi.testclient import TestClient

def test_analytics_revenue_range_admin(client: TestClient, admin_token: str):
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = datetime.now().strftime("%Y-%m-%d")

    res = client.get(
        f"/api/v1/analytics/revenue-range?start_date={start_date}&end_date={end_date}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "total_revenue" in data
    assert "daily_breakdown" in data
    assert data["start_date"] == start_date
    assert data["end_date"] == end_date

def test_analytics_stylist_performance_admin(client: TestClient, admin_token: str):
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = datetime.now().strftime("%Y-%m-%d")

    res = client.get(
        f"/api/v1/analytics/stylist-performance?start_date={start_date}&end_date={end_date}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "stylists" in data
    assert isinstance(data["stylists"], list)

def test_analytics_allowed_for_receptionist(client: TestClient, receptionist_token: str):
    start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    end_date = datetime.now().strftime("%Y-%m-%d")

    res = client.get(
        f"/api/v1/analytics/revenue-range?start_date={start_date}&end_date={end_date}",
        headers={"Authorization": f"Bearer {receptionist_token}"}
    )
    assert res.status_code == 200
