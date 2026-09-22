from time import perf_counter
from sqlalchemy import text
from database import SessionLocal

db = SessionLocal()

try:
    print("Testing connection acquisition...")

    t0 = perf_counter()
    connection = db.connection()
    t1 = perf_counter()

    print(f"db.connection(): {t1 - t0:.3f}s")

    print("Testing SELECT 1...")

    t2 = perf_counter()
    connection.execute(text("SELECT 1"))
    t3 = perf_counter()

    print(f"SELECT 1:        {t3 - t2:.3f}s")

    print("Testing user lookup...")

    t4 = perf_counter()
    result = connection.execute(
        text("SELECT id, email FROM users WHERE email = :email"),
        {"email": input("Email: ").strip().lower()},
    ).fetchone()
    t5 = perf_counter()

    print(f"User SQL query:   {t5 - t4:.3f}s")
    print(f"User found:       {result is not None}")

finally:
    db.close()
