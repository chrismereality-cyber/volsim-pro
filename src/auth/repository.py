from sqlalchemy import select
from sqlalchemy.orm import Session

from auth_models import User, Role, UserRole


class AuthRepository:
    """Database access for authentication and role assignment."""

    @staticmethod
    def get_user_by_email(
        db: Session,
        email: str,
    ) -> User | None:
        return db.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

    @staticmethod
    def get_user_by_id(
        db: Session,
        user_id: int,
    ) -> User | None:
        return db.get(User, user_id)

    @staticmethod
    def get_role_by_name(
        db: Session,
        role_name: str,
    ) -> Role | None:
        return db.execute(
            select(Role).where(Role.name == role_name)
        ).scalar_one_or_none()

    @staticmethod
    def create_user(
        db: Session,
        *,
        email: str,
        password_hash: str,
        is_verified: bool = False,
    ) -> User:
        user = User(
            email=email,
            password_hash=password_hash,
            is_active=True,
            is_verified=is_verified,
        )

        db.add(user)
        db.flush()

        return user

    @staticmethod
    def assign_role(
        db: Session,
        *,
        user: User,
        role: Role,
    ) -> UserRole:
        existing = db.execute(
            select(UserRole).where(
                UserRole.user_id == user.id,
                UserRole.role_id == role.id,
            )
        ).scalar_one_or_none()

        if existing:
            return existing

        assignment = UserRole(
            user_id=user.id,
            role_id=role.id,
        )

        db.add(assignment)
        db.flush()

        return assignment

    @staticmethod
    def get_user_roles(
        db: Session,
        user_id: int,
    ) -> list[str]:
        rows = db.execute(
            select(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .where(UserRole.user_id == user_id)
        ).scalars().all()

        return list(rows)
