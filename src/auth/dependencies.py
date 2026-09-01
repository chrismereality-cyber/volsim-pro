from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from sqlalchemy.orm import Session

from database import get_db

from .models import AuthorizationContext, Identity
from .rbac import require_permission
from .repository import AuthRepository
from .service import AuthorizationService, IdentityService
from .tokens import decode_access_token


bearer_scheme = HTTPBearer(
    auto_error=False,
)


def get_current_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> Identity:
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

        user_id = int(payload["sub"])

    except (
        ValueError,
        TypeError,
        jwt.InvalidTokenError,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = AuthRepository.get_user_by_id(
        db,
        user_id,
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive or does not exist.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    roles = AuthRepository.get_user_roles(
        db,
        user.id,
    )

    return IdentityService.build_identity(
        user_id=str(user.id),
        username=user.email,
        roles=roles,
        is_active=user.is_active,
    )


def get_authorization_context(
    identity: Identity = Depends(
        get_current_identity
    ),
) -> AuthorizationContext:
    return AuthorizationService.context(
        identity,
        source="fastapi",
    )


def permission_dependency(
    permission: str,
) -> Callable:
    def dependency(
        context: AuthorizationContext = Depends(
            get_authorization_context
        ),
    ) -> AuthorizationContext:
        try:
            require_permission(
                context,
                permission,
            )
        except PermissionError as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=str(exc),
            )

        return context

    return dependency
