from typing import Callable

from .models import AuthorizationContext
from .rbac import require_permission


def permission_guard(permission: str) -> Callable:
    """
    Framework-neutral authorization dependency.

    FastAPI adapters can call this function from route dependencies.
    """

    def guard(context: AuthorizationContext) -> AuthorizationContext:
        require_permission(context, permission)
        return context

    return guard
