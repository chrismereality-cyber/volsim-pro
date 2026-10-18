from types import SimpleNamespace

import pytest

from src.auth.service import IdentityService


def test_identity_resolution_uses_current_database_roles(monkeypatch):
    from src.auth import service as service_module

    user = SimpleNamespace(id=12, email="trader@example.test", is_active=True)
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_by_id",
        lambda db, user_id: user if user_id == 12 else None,
    )
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_roles",
        lambda db, user_id: ["user"],
    )

    identity = IdentityService.from_access_token_payload(
        object(),
        {"sub": "12", "username": "stale@example.test", "roles": ["superadmin"]},
    )

    assert identity.user_id == "12"
    assert identity.username == "trader@example.test"
    assert identity.roles == frozenset({"user"})
    assert "orders.create" not in identity.permissions
    assert "*" not in identity.permissions


@pytest.mark.parametrize(
    "user",
    [
        None,
        SimpleNamespace(id=12, email="disabled@example.test", is_active=False),
    ],
)
def test_identity_resolution_rejects_missing_or_inactive_user(monkeypatch, user):
    from src.auth import service as service_module

    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_by_id",
        lambda db, user_id: user,
    )
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_roles",
        lambda db, user_id: pytest.fail(
            "Roles must not load for unavailable users"
        ),
    )

    with pytest.raises(ValueError, match="Account is unavailable"):
        IdentityService.from_access_token_payload(
            object(),
            {"sub": "12", "roles": ["admin"]},
        )


def test_identity_resolution_handles_roleless_account(monkeypatch):
    from src.auth import service as service_module

    user = SimpleNamespace(id=12, email="roleless@example.test", is_active=True)
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_by_id",
        lambda db, user_id: user if user_id == 12 else None,
    )
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_roles",
        lambda db, user_id: [],
    )

    identity = IdentityService.from_access_token_payload(
        object(),
        {"sub": "12", "roles": ["superadmin"]},
    )

    assert identity.user_id == "12"
    assert identity.roles == frozenset()
    assert identity.permissions == frozenset()
    assert "*" not in identity.permissions
    assert "orders.create" not in identity.permissions


@pytest.mark.parametrize(
    "token_roles",
    [
        pytest.param(None, id="missing-roles"),
        pytest.param("superadmin", id="malformed-roles"),
    ],
)
def test_identity_resolution_ignores_token_roles_claim(monkeypatch, token_roles):
    from src.auth import service as service_module

    user = SimpleNamespace(id=12, email="current@example.test", is_active=True)
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_by_id",
        lambda db, user_id: user if user_id == 12 else None,
    )
    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_roles",
        lambda db, user_id: ["user"],
    )

    payload = {"sub": "12"}
    if token_roles is not None:
        payload["roles"] = token_roles

    identity = IdentityService.from_access_token_payload(object(), payload)

    assert identity.user_id == "12"
    assert identity.username == "current@example.test"
    assert identity.roles == frozenset({"user"})
    assert "orders.create" not in identity.permissions
    assert "*" not in identity.permissions


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"sub": "not-an-integer", "roles": ["user"]},
        {"sub": "0", "roles": ["user"]},
    ],
)
def test_identity_resolution_rejects_invalid_token_claims(monkeypatch, payload):
    from src.auth import service as service_module

    monkeypatch.setattr(
        service_module.AuthRepository,
        "get_user_by_id",
        lambda db, user_id: pytest.fail(
            "Invalid claims must not query the user"
        ),
    )

    with pytest.raises(ValueError):
        IdentityService.from_access_token_payload(object(), payload)
