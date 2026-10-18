from types import SimpleNamespace

from fastapi.testclient import TestClient

from database import get_db
from src.api import main as main_module
from src.auth import dependencies as dependencies_module
from src.auth.repository import AuthRepository
from src.auth.tokens import create_access_token


def _client_for_user(monkeypatch, *, active=True, current_roles=None):
    user = SimpleNamespace(
        id=12,
        email="current-user@example.test",
        is_active=active,
    )
    roles = ["user"] if current_roles is None else current_roles

    monkeypatch.setattr(
        AuthRepository,
        "get_user_by_id",
        lambda db, user_id: user if user_id == 12 else None,
    )
    monkeypatch.setattr(
        AuthRepository,
        "get_user_roles",
        lambda db, user_id: list(roles),
    )
    monkeypatch.setattr(
        main_module.mt5_service,
        "get_instrument_registry",
        lambda: [],
    )

    main_module.app.dependency_overrides[get_db] = lambda: object()

    token = create_access_token(
        user_id="12",
        username="stale-token@example.test",
        roles=["superadmin"],
    )
    client = TestClient(main_module.app, raise_server_exceptions=True)
    return client, token


def test_http_endpoint_uses_current_database_roles_not_stale_jwt_roles(monkeypatch):
    client, token = _client_for_user(monkeypatch)

    try:
        response = client.post(
            "/api/instruments/mt5/XAUUSDm/activate",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 403
        assert response.json()["detail"] == (
            "Permission denied: instruments.manage"
        )
    finally:
        main_module.app.dependency_overrides.pop(get_db, None)


def test_http_endpoint_rejects_inactive_database_account(monkeypatch):
    client, token = _client_for_user(monkeypatch, active=False)

    try:
        response = client.get(
            "/api/instruments/mt5",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == (
            "Invalid token identity or unavailable account."
        )
    finally:
        main_module.app.dependency_overrides.pop(get_db, None)


def test_http_read_endpoint_accepts_current_user_role(monkeypatch):
    client, token = _client_for_user(monkeypatch)

    try:
        response = client.get(
            "/api/instruments/mt5",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["instruments"] == []
    finally:
        main_module.app.dependency_overrides.pop(get_db, None)