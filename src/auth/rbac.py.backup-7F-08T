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
        "risk.read",
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
        "risk.read",
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
        "risk.read",
        "risk.manage",
        "users.read",
        "users.manage",
        "rbac.read",
        "rbac.manage",
        "system.manage",
        "capital.read",
        "capital.request",
        "capital.manage",
        "capital.approve",
        "capital.execute",
        "capital.reconcile",
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
        permissions.update(
            ROLE_PERMISSIONS.get(role, frozenset())
        )

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

    role_permissions = permissions_for_roles(
        identity.roles
    )

    if "*" in role_permissions:
        return True

    return (
        permission in identity.permissions
        or permission in role_permissions
    )


def require_permission(
    context: AuthorizationContext,
    permission: str,
) -> None:
    if not has_permission(context, permission):
        raise AuthorizationError(
            f"Permission denied: {permission}"
        )
