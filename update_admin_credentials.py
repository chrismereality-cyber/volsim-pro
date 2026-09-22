from getpass import getpass

from sqlalchemy import select

from database import SessionLocal
from auth_models import User
from src.auth.password import hash_password


USER_ID = 11

new_email = input("Enter the new admin email: ").strip().lower()
new_password = getpass("Enter the new admin password: ")

if not new_email:
    raise RuntimeError("Email cannot be empty.")

if len(new_password) < 8:
    raise RuntimeError("Password must contain at least 8 characters.")

db = SessionLocal()

try:
    user = db.execute(
        select(User).where(User.id == USER_ID)
    ).scalar_one()

    duplicate = db.execute(
        select(User).where(
            User.email == new_email,
            User.id != USER_ID,
        )
    ).scalar_one_or_none()

    if duplicate:
        raise RuntimeError("That email already belongs to another user.")

    user.email = new_email
    user.password_hash = hash_password(new_password)

    db.commit()

    print("")
    print("ADMIN_CREDENTIALS_UPDATED")
    print("USER_ID:", user.id)
    print("EMAIL:", user.email)
    print("ACTIVE:", user.is_active)
    print("ROLES_PRESERVED: existing roles unchanged")

except Exception:
    db.rollback()
    raise

finally:
    db.close()
