from datetime import datetime, timedelta, timezone
import hashlib
import secrets


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_token_expiry(days: int = 30) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def is_refresh_token_expired(expires_at: datetime) -> bool:
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return datetime.now(timezone.utc) >= expires_at
