from time import perf_counter
from database import SessionLocal
from src.auth.repository import AuthRepository
from src.auth.password import verify_password
from src.auth.service import IdentityService

email = input("Login email: ").strip().lower()
password = input("Login password: ")

db = SessionLocal()

try:
    t0 = perf_counter()

    t1 = perf_counter()
    user = AuthRepository.get_user_by_email(db, email)
    t2 = perf_counter()

    if user is None:
        print("USER NOT FOUND")
        raise SystemExit(1)

    t3 = perf_counter()
    password_ok = verify_password(password, user.password_hash)
    t4 = perf_counter()

    if not password_ok:
        print("PASSWORD VERIFICATION FAILED")
        raise SystemExit(1)

    t5 = perf_counter()
    roles = AuthRepository.get_user_roles(db, user.id)
    t6 = perf_counter()

    t7 = perf_counter()
    identity = IdentityService.build_identity(
        user_id=str(user.id),
        username=user.email,
        roles=roles,
        is_active=user.is_active,
    )
    t8 = perf_counter()

    print("")
    print("AUTHENTICATE() STAGE TIMING")
    print("---------------------------")
    print(f"get_user_by_email(): {t2 - t1:.3f}s")
    print(f"verify_password():   {t4 - t3:.3f}s")
    print(f"get_user_roles():    {t6 - t5:.3f}s")
    print(f"build_identity():    {t8 - t7:.3f}s")
    print(f"AUTH TOTAL:          {t8 - t0:.3f}s")

finally:
    db.close()
