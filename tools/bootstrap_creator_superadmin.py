"""One-time bootstrap of the canonical VolSim-Pro creator account.

This tool is intentionally separate from public registration and the
administrator API. It establishes the initial trusted superadmin identity
without weakening normal RBAC boundaries.
"""

from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import delete, select

from database import SessionLocal
from auth_models import Role, User, UserRole


CREATOR_EMAIL = "chrismereality@gmail.com"
EXPECTED_CREATOR_USER_ID = 11
SUPERADMIN_ROLE_NAME = "superadmin"


def main() -> None:
    with SessionLocal() as db:
        user = db.execute(
            select(User).where(
                User.email == CREATOR_EMAIL
            )
        ).scalar_one_or_none()

        if user is None:
            raise RuntimeError(
                f"Creator account not found: {CREATOR_EMAIL}"
            )

        if user.id != EXPECTED_CREATOR_USER_ID:
            raise RuntimeError(
                "Creator identity mismatch: "
                f"expected user ID {EXPECTED_CREATOR_USER_ID}, "
                f"found {user.id}."
            )

        if not user.is_active:
            raise RuntimeError(
                "Creator account is inactive; refusing bootstrap."
            )

        superadmin = db.execute(
            select(Role).where(
                Role.name == SUPERADMIN_ROLE_NAME
            )
        ).scalar_one_or_none()

        if superadmin is None:
            raise RuntimeError(
                "Canonical 'superadmin' role does not exist."
            )

        current_roles = db.execute(
            select(Role.name)
            .join(
                UserRole,
                UserRole.role_id == Role.id,
            )
            .where(
                UserRole.user_id == user.id
            )
            .order_by(Role.name.asc())
        ).scalars().all()

        print("=== CREATOR SUPERADMIN BOOTSTRAP ===")
        print(f"Creator email:       {user.email}")
        print(f"Creator user ID:     {user.id}")
        print(f"Active:              {user.is_active}")
        print(f"Current roles:       {current_roles}")
        print(f"Superadmin role ID:  {superadmin.id}")

        db.execute(
            delete(UserRole).where(
                UserRole.user_id == user.id
            )
        )

        db.add(
            UserRole(
                user_id=user.id,
                role_id=superadmin.id,
            )
        )

        db.commit()

        final_roles = db.execute(
            select(Role.name)
            .join(
                UserRole,
                UserRole.role_id == Role.id,
            )
            .where(
                UserRole.user_id == user.id
            )
            .order_by(Role.name.asc())
        ).scalars().all()

        print("\nBootstrap completed successfully.")
        print(f"Final roles:         {final_roles}")
        print("Creator authority:   superadmin (*)")


if __name__ == "__main__":
    main()
