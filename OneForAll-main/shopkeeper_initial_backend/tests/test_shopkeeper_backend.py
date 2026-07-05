import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2]))

from shopkeeper_initial_backend.main import app


def test_app_has_expected_routes():
    routes = {route.path for route in app.routes}
    assert "/register" in routes
    assert "/login" in routes
    assert "/profile" in routes
    assert "/shopkeepers" in routes
    assert "/api/v1/inventory" in routes
    assert "/api/v1/orders" in routes
