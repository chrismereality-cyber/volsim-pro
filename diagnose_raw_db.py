import os
from time import perf_counter
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"C:\volsim-dev\.env")

url = os.getenv("DATABASE_URL")

print("Connecting directly with psycopg2...")

t0 = perf_counter()

conn = psycopg2.connect(url)

t1 = perf_counter()

print(f"Connection: {t1 - t0:.3f}s")

try:
    cur = conn.cursor()

    print("Testing SELECT 1...")

    t2 = perf_counter()
    cur.execute("SELECT 1")
    cur.fetchone()
    t3 = perf_counter()

    print(f"SELECT 1: {t3 - t2:.3f}s")

    email = input("Email: ").strip().lower()

    print("Testing direct users query...")

    t4 = perf_counter()
    cur.execute(
        "SELECT id, email FROM users WHERE email = %s",
        (email,),
    )
    row = cur.fetchone()
    t5 = perf_counter()

    print(f"User query: {t5 - t4:.3f}s")
    print(f"User found: {row is not None}")

finally:
    conn.close()
