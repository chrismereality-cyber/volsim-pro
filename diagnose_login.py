from time import perf_counter
from database import SessionLocal
from src.auth.authentication import AuthenticationService
from src.auth.tokens import create_access_token
from src.auth.repository import AuthRepository

email = input("Login email: ").strip()
password = input("Login password: ")

db = SessionLocal()

try:
    t0 = perf_counter()

    t1 = perf_counter()
    result = AuthenticationService.authenticate(
        db,
        email=email,
        password=password,
    )
    t2 = perf_counter()

    if result is None:
        print("AUTHENTICATION FAILED")
        raise SystemExit(1)

    user, identity = result

    t3 = perf_counter()
    refresh_token, session = AuthenticationService.create_session(
        db,
        user_id=user.id,
    )
    t4 = perf_counter()

    access_token = create_access_token(
        user_id=str(user.id),
        username=user.email,
        roles=sorted(identity.roles),
    )
    t5 = perf_counter()

    print("")
    print("LOGIN STAGE TIMING")
    print("------------------")
    print(f"authenticate():      {t2 - t1:.3f}s")
    print(f"create_session():    {t4 - t3:.3f}s")
    print(f"create_access_token(): {t5 - t4:.3f}s")
    print(f"TOTAL:               {t5 - t0:.3f}s")

finally:
    db.close()
