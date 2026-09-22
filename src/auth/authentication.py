import time

from sqlalchemy.orm import Session

from auth_models import AuthSession
from .models import Identity
from .password import hash_password, verify_password
from .repository import AuthRepository
from .service import IdentityService
from .tokens import (
    create_refresh_token,
    hash_refresh_token,
    is_refresh_token_expired,
    refresh_token_expiry,
)


class AuthenticationService:
    """Registration, login, and refresh-token session service."""

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
        import time
        _auth_start = time.perf_counter()

        email = email.strip().lower()

        _t = time.perf_counter()
        user = AuthRepository.get_user_by_email(db, email)
        print(f"AUTH TIMING: user lookup = {time.perf_counter() - _t:.3f}s")

        if user is None:
            return None

        if not user.is_active:
            return None

        _t = time.perf_counter()
        if not verify_password(password, user.password_hash):
            return None
        print(f"AUTH TIMING: password verify = {time.perf_counter() - _t:.3f}s")

        _t = time.perf_counter()
        roles = AuthRepository.get_user_roles(
            db,
            user.id,
        )
        print(f"AUTH TIMING: role lookup = {time.perf_counter() - _t:.3f}s")

        _t = time.perf_counter()
        identity = IdentityService.build_identity(
            user_id=str(user.id),
            username=user.email,
            roles=roles,
            is_active=user.is_active,
        )
        print(f"AUTH TIMING: identity build = {time.perf_counter() - _t:.3f}s")
        print(f"AUTH TIMING: authenticate total = {time.perf_counter() - _auth_start:.3f}s")

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

        _session_start = time.perf_counter()

        _t = time.perf_counter()
        db.add(session)
        print(f"SESSION TIMING: db.add = {time.perf_counter() - _t:.3f}s")

        _t = time.perf_counter()
        db.commit()
        print(f"SESSION TIMING: db.commit = {time.perf_counter() - _t:.3f}s")

        print("SESSION TIMING: db.refresh = SKIPPED (not required for login response)")

        print(f"SESSION TIMING: create_session total = {time.perf_counter() - _session_start:.3f}s")

        return raw_token, session

    @staticmethod
    def refresh_session(
        db: Session,
        *,
        refresh_token: str,
    ):
        if not refresh_token or not refresh_token.strip():
            raise ValueError("Refresh token is required.")

        token_hash = hash_refresh_token(refresh_token)

        session = AuthRepository.get_session_by_refresh_token_hash(
            db,
            token_hash,
        )

        if session is None:
            raise ValueError("Invalid refresh token.")

        if session.revoked_at is not None:
            raise ValueError("Refresh token has been revoked.")

        if is_refresh_token_expired(session.expires_at):
            raise ValueError("Refresh token has expired.")

        user = AuthRepository.get_user_by_id(
            db,
            session.user_id,
        )

        if user is None or not user.is_active:
            raise ValueError(
                "User account is inactive or unavailable."
            )

        _t = time.perf_counter()
        roles = AuthRepository.get_user_roles(
            db,
            user.id,
        )
        print(f"AUTH TIMING: role lookup = {time.perf_counter() - _t:.3f}s")

        identity = IdentityService.build_identity(
            user_id=str(user.id),
            username=user.email,
            roles=roles,
            is_active=user.is_active,
        )

        AuthRepository.revoke_session(
            db,
            session,
        )

        new_refresh_token = create_refresh_token()
        new_token_hash = hash_refresh_token(new_refresh_token)

        new_session = AuthSession(
            user_id=user.id,
            refresh_token_hash=new_token_hash,
            expires_at=refresh_token_expiry(),
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)

        return user, identity, new_refresh_token, new_session





