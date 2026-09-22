from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import inspect
from database import engine


print("=" * 80)
print("VOLSIM-PRO DATABASE AUTH/RBAC TABLE AUDIT")
print("=" * 80)

inspector = inspect(engine)
tables = inspector.get_table_names()

targets = [
    "users",
    "user_roles",
    "auth_sessions",
    "audit_events",
]

print("\nAuthentication / RBAC tables:")

for table in targets:
    status = "EXISTS" if table in tables else "MISSING"
    print(f"{table:<20} {status}")

print("\nExisting relevant tables:")

relevant_terms = (
    "user",
    "auth",
    "role",
    "audit",
    "account",
    "wallet",
    "position",
    "trade",
    "order",
)

for table in sorted(tables):
    if any(term in table.lower() for term in relevant_terms):
        print(f"  {table}")

print("\nDatabase audit complete.")
