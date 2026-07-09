import sys
from pathlib import Path

from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[2]))

from shopkeeper_initial_backend.main import app
from shopkeeper_initial_backend import database


def test_app_has_expected_routes():
    routes = {route.path for route in app.routes}
    assert "/register" in routes
    assert "/login" in routes
    assert "/profile" in routes
    assert "/shopkeepers" in routes
    assert "/api/v1/inventory" in routes
    assert "/api/v1/orders" in routes
    assert "/upload-image" in routes


def test_database_defaults_to_sqlite_for_local_development():
    assert database.DATABASE_URL.startswith("sqlite")


def test_upload_image_endpoint_requires_auth_and_returns_url():
    client = TestClient(app)
    login_response = client.post("/login", json={"email": "admin", "password": "admin"})
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]
    response = client.post(
        "/upload-image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("test.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 200
    assert response.json()["url"].startswith("http")
    assert "/uploads/images/" in response.json()["url"]
