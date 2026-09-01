from dataclasses import dataclass
from typing import Iterable

from .models import AuthorizationContext


ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "user": frozenset({
        "dashboard.read",
        "portfolio.read",
        "positions.read",
        "orders.read",
        "vault.read",
        "analytics.read",
    }),

    "trader": frozenset({
        "dashboard.read",
        "portfolio.read",
        "positions.read",
        "orders.read",
        "orders.create",
        "orders.cancel",
        "vault.read",
        "analytics.read",
    }),

    "admin": frozenset({
        "dashboard.read",
        "portfolio.read",
        "positions.read",
        "orders.read",
        "orders.create",
        "orders.cancel",
        "vault.read",
        "vault.manage",
        "analytics.read",
        "users.read",
        "users.manage",
        "rbac.read",
        "rbac.manage",
        "system.manage",
    }),

    "superadmin": frozenset({
        "*",
    }),
}


class AuthorizationError(PermissionError):
    """Raised when an identity is not authorized."""


def permissions_for_roles(roles: Iterable[str]) -> frozenset[str]:
    permissions: set[str] = set()

    for role in roles:
        permissions.update(ROLE_PERMISSIONS.get(role, frozenset()))

    return frozenset(permissions)


def has_permission(
    context: AuthorizationContext,
    permission: str,
) -> bool:
    identity = context.identity

    if not identity.is_active:
        return False

    if "*" in identity.permissions:
        return True

    return permission in identity.permissions


def require_permission(
    context: AuthorizationContext,
    permission: str,
) -> None:
    if not has_permission(context, permission):
        raise AuthorizationError(
            f"Permission denied: {permission}"
        )
