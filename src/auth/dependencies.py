from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from .models import AuthorizationContext
from .rbac import AuthorizationError, require_permission
from .service import AuthorizationService, IdentityService
from .tokens import decode_access_token


_bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_authorization_context(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        _bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> AuthorizationContext:
    """
    Resolve the authenticated caller from a JWT Bearer token.

    JWT claims provide the authenticated identity attributes.
    Permissions are rebuilt server-side from the canonical RBAC role map.
    """

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(
            credentials.credentials
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    try:
        identity = IdentityService.from_access_token_payload(
            db,
            payload,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token identity or unavailable account.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    return AuthorizationService.context(
        identity,
        source="jwt",
    )


def permission_guard(permission: str) -> Callable:
    """
    FastAPI dependency factory for RBAC-protected routes.

    Authentication failures return HTTP 401.
    Authorization failures return HTTP 403.
    """

    def guard(
        context: AuthorizationContext = Depends(
            get_authorization_context
        ),
    ) -> AuthorizationContext:

        try:
            require_permission(
                context,
                permission,
            )

        except AuthorizationError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}",
            ) from None

        return context

    return guard
