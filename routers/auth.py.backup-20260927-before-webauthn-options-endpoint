from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from src.auth.authentication import AuthenticationService
from src.auth.dependencies import get_authorization_context
from src.auth.models import AuthorizationContext
from src.auth.repository import AuthRepository
from src.auth.tokens import create_access_token


router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response Contracts
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    is_verified: bool
    roles: list[str]


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class IdentityResponse(BaseModel):
    user_id: str
    username: str | None
    roles: list[str]
    permissions: list[str]
    is_active: bool


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    try:
        user = AuthenticationService.register(
            db,
            email=payload.email,
            password=payload.password,
            role_name="user",
        )

        roles = AuthRepository.get_user_roles(
            db,
            user.id,
        )

        return UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=roles,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    import time
    _login_start = time.perf_counter()
    _login_db = time.perf_counter()
    _before_auth = time.perf_counter()
    result = AuthenticationService.authenticate(
        db,
        email=payload.email,
        password=payload.password,
    )
    print(f"LOGIN TIMING: DB acquired -> authenticate start = {_before_auth - _login_db:.3f}s")
    print(f"LOGIN TIMING: authenticate = {time.perf_counter() - _before_auth:.3f}s")

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user, identity = result

    _before_session = time.perf_counter()
    refresh_token, _session = AuthenticationService.create_session(
        db,
        user_id=user.id,
    )
    print(f"LOGIN TIMING: create_session = {time.perf_counter() - _before_session:.3f}s")

    _before_token = time.perf_counter()
    access_token = create_access_token(
        user_id=str(user.id),
        username=user.email,
        roles=sorted(identity.roles),
    )
    print(f"LOGIN TIMING: create_access_token = {time.perf_counter() - _before_token:.3f}s")
    print(f"LOGIN TIMING: TOTAL = {time.perf_counter() - _login_start:.3f}s")

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            is_active=user.is_active,
            is_verified=user.is_verified,
            roles=sorted(identity.roles),
        ),
    )


# ---------------------------------------------------------------------------
# Refresh Access + Refresh Tokens
# ---------------------------------------------------------------------------

@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    payload: RefreshRequest,
    db: Session = Depends(get_db),
):
    try:
        (
            user,
            identity,
            refresh_token,
            _session,
        ) = AuthenticationService.refresh_session(
            db,
            refresh_token=payload.refresh_token,
        )

        access_token = create_access_token(
            user_id=str(user.id),
            username=user.email,
            roles=sorted(identity.roles),
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                is_active=user.is_active,
                is_verified=user.is_verified,
                roles=sorted(identity.roles),
            ),
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc


# ---------------------------------------------------------------------------
# Current Authenticated Identity
# ---------------------------------------------------------------------------

@router.get(
    "/me",
    response_model=IdentityResponse,
)
def me(
    context: AuthorizationContext = Depends(
        get_authorization_context
    ),
):
    identity = context.identity

    return IdentityResponse(
        user_id=identity.user_id,
        username=identity.username,
        roles=sorted(identity.roles),
        permissions=sorted(identity.permissions),
        is_active=identity.is_active,
    )

