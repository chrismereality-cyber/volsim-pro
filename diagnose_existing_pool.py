from time import perf_counter
from sqlalchemy import text
from database import engine

print("Testing EXISTING application engine")
print("")

for i in range(5):
    t0 = perf_counter()

    with engine.connect() as conn:
        t1 = perf_counter()
        conn.execute(text("SELECT 1"))
        t2 = perf_counter()

    print(
        f"Request {i + 1}: "
        f"connection={t1-t0:.3f}s | "
        f"query={t2-t1:.3f}s | "
        f"total={t2-t0:.3f}s"
    )
