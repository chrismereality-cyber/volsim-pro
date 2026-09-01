from sqlalchemy.orm import Session

from auth_models import AuthSession
from .models import Identity
from .password import hash_password, verify_password
from .repository import AuthRepository
from .service import IdentityService
from .tokens import (
    create_refresh_token,
    hash_refresh_token,
    refresh_token_expiry,
)


class AuthenticationService:
    """Registration and login service."""

    @staticmethod
    def register(
        db: Session,
        *,
        email: str,
        password: str,
        role_name: str = "user",
    ):
        email = email.strip().lower()

        if not email:
            raise ValueError("Email is required.")

        if len(password) < 8:
            raise ValueError(
                "Password must contain at least 8 characters."
            )

        existing = AuthRepository.get_user_by_email(db, email)

        if existing:
            raise ValueError("A user with this email already exists.")

        role = AuthRepository.get_role_by_name(db, role_name)

        if role is None:
            raise ValueError(
                f"Role '{role_name}' does not exist."
            )

        user = AuthRepository.create_user(
            db,
            email=email,
            password_hash=hash_password(password),
        )

        AuthRepository.assign_role(
            db,
            user=user,
            role=role,
        )

        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def authenticate(
        db: Session,
        *,
        email: str,
        password: str,
    ):
        email = email.strip().lower()

        user = AuthRepository.get_user_by_email(db, email)

        if user is None:
            return None

        if not user.is_active:
            return None

        if not verify_password(password, user.password_hash):
            return None

        roles = AuthRepository.get_user_roles(
            db,
            user.id,
        )

        identity = IdentityService.build_identity(
            user_id=str(user.id),
            username=user.email,
            roles=roles,
            is_active=user.is_active,
        )

        return user, identity

    @staticmethod
    def create_session(
        db: Session,
        *,
        user_id: int,
    ):
        raw_token = create_refresh_token()
        token_hash = hash_refresh_token(raw_token)

        session = AuthSession(
            user_id=user_id,
            refresh_token_hash=token_hash,
            expires_at=refresh_token_expiry(),
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return raw_token, session
