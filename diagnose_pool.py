import os
from time import perf_counter

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(r"C:\volsim-dev\.env")

url = os.getenv("DATABASE_URL")

for name, kwargs in [
    (
        "CURRENT: pool_pre_ping=True",
        {
            "pool_pre_ping": True,
        },
    ),
    (
        "TEST: pool_pre_ping=False",
        {
            "pool_pre_ping": False,
        },
    ),
]:
    print("")
    print("=" * 55)
    print(name)
    print("=" * 55)

    engine = create_engine(url, **kwargs)

    try:
        t0 = perf_counter()

        with engine.connect() as conn:
            t1 = perf_counter()

            conn.execute(text("SELECT 1"))
            t2 = perf_counter()

            conn.execute(
                text("SELECT id, email FROM users WHERE email = :email"),
                {"email": "chrismereality@gmail.com"},
            ).fetchone()
            t3 = perf_counter()

        print(f"Connection acquisition: {t1 - t0:.3f}s")
        print(f"SELECT 1:              {t2 - t1:.3f}s")
        print(f"User query:            {t3 - t2:.3f}s")

    finally:
        engine.dispose()
