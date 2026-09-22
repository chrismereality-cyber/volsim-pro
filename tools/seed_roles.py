from sqlalchemy import select

from database import engine, Base
from sqlalchemy.orm import Session
from auth_models import Role


ROLES = [
    {
        "name": "user",
        "description": "Standard VolSim-Pro user.",
    },
    {
        "name": "trader",
        "description": "User authorized to create and cancel trading orders.",
    },
    {
        "name": "admin",
        "description": "Administrative VolSim-Pro operator.",
    },
    {
        "name": "superadmin",
        "description": "Full system authority.",
    },
]


def seed_roles():
    with Session(engine) as db:
        created = 0

        for role_data in ROLES:
            existing = db.execute(
                select(Role).where(
                    Role.name == role_data["name"]
                )
            ).scalar_one_or_none()

            if existing is None:
                db.add(Role(**role_data))
                created += 1

        db.commit()

        print(f"Roles created: {created}")


if __name__ == "__main__":
    seed_roles()
