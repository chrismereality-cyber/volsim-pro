"""Seed the canonical VolSim-Pro RBAC roles."""

from pathlib import Path
import sys

# Ensure the VolSim-Pro project root is importable when this script
# is executed directly from the tools directory.
PROJECT_ROOT = Path(__file__).resolve().parents[1]

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from sqlalchemy import text

from database import engine


ROLES = [
    (
        "user",
        "Standard VolSim-Pro user with read-only access to permitted trading data.",
    ),
    (
        "trader",
        "Trading-enabled user allowed to create and cancel orders.",
    ),
    (
        "admin",
        "Administrative operator with user, RBAC, vault, and system management access.",
    ),
    (
        "superadmin",
        "Unrestricted system administrator with all permissions.",
    ),
]


def main() -> None:
    with engine.begin() as connection:
        for name, description in ROLES:
            connection.execute(
                text(
                    """
                    INSERT INTO roles (name, description)
                    VALUES (:name, :description)
                    ON CONFLICT (name)
                    DO UPDATE SET description = EXCLUDED.description
                    """
                ),
                {
                    "name": name,
                    "description": description,
                },
            )

    print("Canonical RBAC roles seeded successfully.")


if __name__ == "__main__":
    main()
