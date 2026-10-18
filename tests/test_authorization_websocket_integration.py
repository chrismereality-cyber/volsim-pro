from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from src.api import main as main_module
from src.auth.repository import AuthRepository
from src.auth.tokens import create_access_token


def test_websocket_rejects_inactive_account_before_connected_status(monkeypatch):
    user = SimpleNamespace(
        id=12,
        email="disabled-user@example.test",
        is_active=False,
    )
    session_state = {"closed": False}

    class FakeSession:
        def close(self):
            session_state["closed"] = True

    monkeypatch.setattr(
        AuthRepository,
        "get_user_by_id",
        lambda db, user_id: user if user_id == 12 else None,
    )
    monkeypatch.setattr(
        AuthRepository,
        "get_user_roles",
        lambda db, user_id: pytest.fail(
            "Roles must not be queried for an inactive account."
        ),
    )
    monkeypatch.setattr(
        main_module,
        "SessionLocal",
        FakeSession,
    )

    token = create_access_token(
        user_id="12",
        username="stale-token@example.test",
        roles=["superadmin"],
    )

    client = TestClient(main_module.app, raise_server_exceptions=True)

    with client.websocket_connect("/ws/trading-state") as websocket:
        websocket.send_json({
            "type": "authenticate",
            "token": token,
        })

        with pytest.raises(WebSocketDisconnect) as exc_info:
            websocket.receive_json()

        assert exc_info.value.code == 1008
        assert "unavailable account" in exc_info.value.reason.lower()

    assert session_state["closed"] is True