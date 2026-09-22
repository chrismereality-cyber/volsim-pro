import os
from time import perf_counter

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(r"C:\volsim-dev\.env")

url = os.getenv("DATABASE_URL")

engine = create_engine(
    url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    pool_recycle=1800,
)

try:
    print("Warming SQLAlchemy pool...")

    for i in range(3):
        t0 = perf_counter()

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        elapsed = perf_counter() - t0

        print(
            f"Warm-up {i + 1}: "
            f"{elapsed:.3f}s"
        )

    print("")
    print("Testing reused pooled connections...")
    print("")

    for i in range(5):
        t0 = perf_counter()

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        elapsed = perf_counter() - t0

        print(
            f"Request {i + 1}: "
            f"{elapsed:.3f}s"
        )

finally:
    engine.dispose()
