from __future__ import annotations

from datetime import datetime, timedelta, timezone
import hashlib
import os
import secrets

from dotenv import load_dotenv
import jwt


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

# Load the project-level .env before reading JWT configuration.
load_dotenv(dotenv_path=r"C:\volsim-dev\.env")


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    )
except ValueError as exc:
    raise RuntimeError(
        "CRITICAL: ACCESS_TOKEN_EXPIRE_MINUTES must be an integer."
    ) from exc


if not JWT_SECRET_KEY:
    raise RuntimeError(
        "CRITICAL: JWT_SECRET_KEY is missing from the environment."
    )

if not JWT_ALGORITHM:
    raise RuntimeError(
        "CRITICAL: JWT_ALGORITHM is missing from the environment."
    )

if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
    raise RuntimeError(
        "CRITICAL: ACCESS_TOKEN_EXPIRE_MINUTES must be greater than zero."
    )


# ---------------------------------------------------------------------------
# Access Token
# ---------------------------------------------------------------------------

def create_access_token(
    *,
    user_id: str,
    username: str | None = None,
    roles: list[str] | tuple[str, ...] | set[str] | None = None,
    expires_minutes: int | None = None,
) -> str:
    """
    Create a signed JWT access token.

    Claims:
        sub      -> authenticated user ID
        username -> normalized username/email
        roles    -> assigned RBAC roles
        iat      -> issued-at timestamp
        exp      -> expiration timestamp
    """

    now = datetime.now(timezone.utc)

    lifetime_minutes = (
        ACCESS_TOKEN_EXPIRE_MINUTES
        if expires_minutes is None
        else expires_minutes
    )

    if lifetime_minutes <= 0:
        raise ValueError(
            "Access-token expiration must be greater than zero."
        )

    expires_at = now + timedelta(minutes=lifetime_minutes)

    normalized_roles = sorted(
        {
            str(role)
            for role in (roles or [])
            if str(role).strip()
        }
    )

    payload = {
        "sub": str(user_id),
        "username": username,
        "roles": normalized_roles,
        "iat": now,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


# ---------------------------------------------------------------------------
# Access Token Verification
# ---------------------------------------------------------------------------

def decode_access_token(token: str) -> dict:
    """
    Verify and decode a JWT access token.

    Raises jwt.InvalidTokenError for invalid,
    expired, malformed, or incorrectly signed tokens.
    """

    if not isinstance(token, str) or not token.strip():
        raise jwt.InvalidTokenError(
            "Access token is missing."
        )

    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
    )


# ---------------------------------------------------------------------------
# Refresh Tokens
# ---------------------------------------------------------------------------

def create_refresh_token() -> str:
    """Create a cryptographically secure opaque refresh token."""
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    """Hash a refresh token before database persistence."""
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def refresh_token_expiry(days: int = 30) -> datetime:
    """Return the expiration timestamp for a refresh token."""
    if days <= 0:
        raise ValueError(
            "Refresh-token lifetime must be greater than zero."
        )

    return (
        datetime.now(timezone.utc)
        + timedelta(days=days)
    )


def is_refresh_token_expired(
    expires_at: datetime,
) -> bool:
    """Return True when a refresh-token expiration timestamp has passed."""

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    return datetime.now(timezone.utc) >= expires_at
