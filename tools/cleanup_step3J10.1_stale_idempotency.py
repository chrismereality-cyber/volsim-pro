from pathlib import Path
import sys
import asyncio
import traceback

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.services.database_service import database_service

print("=" * 62)
print("VOLSIM-PRO STEP 3J.10.1F")
print("TARGETED STALE IDEMPOTENCY TEST-STATE CLEANUP")
print("=" * 62)

async def main():
    print()
    print("TARGET:")
    print("  client_order_id = STEP3J101-UNAUTHORIZED")
    print("  execution_mode  = PAPER")
    print("  status          = IN_PROGRESS")
    print()

    result = await database_service.execute(
        """
        DELETE FROM execution_idempotency
        WHERE client_order_id = $1
          AND execution_mode = $2
          AND status = 'IN_PROGRESS'
          AND result IS NULL
          AND oms_order_id IS NULL
          AND broker_order_ticket IS NULL
          AND broker_deal_ticket IS NULL
          AND broker_position_ticket IS NULL
        """,
        "STEP3J101-UNAUTHORIZED",
        "PAPER",
    )

    print(f"DATABASE RESULT: {result}")
    print()

    remaining = await database_service.fetch(
        """
        SELECT
            client_order_id,
            execution_mode,
            status,
            result,
            oms_order_id,
            broker_order_ticket,
            broker_deal_ticket,
            broker_position_ticket
        FROM execution_idempotency
        WHERE client_order_id = $1
        """,
        "STEP3J101-UNAUTHORIZED",
    )

    print(f"REMAINING MATCHES: {len(remaining)}")

    if remaining:
        for row in remaining:
            print(dict(row))
        raise RuntimeError(
            "Targeted stale row still exists; cleanup did not remove it."
        )

    print()
    print("=" * 62)
    print("STEP 3J.10.1F COMPLETE")
    print("=" * 62)
    print("PASS - only the identified stale test row was targeted.")
    print("PASS - no production source was modified.")
    print("NO MT5 CONNECTION WAS OPENED.")
    print("NO BROKER ORDER WAS TRANSMITTED.")
    print("=" * 62)

try:
    asyncio.run(main())
except Exception as exc:
    print()
    print("=" * 62)
    print("STEP 3J.10.1F FAILED")
    print("=" * 62)
    print(f"{type(exc).__name__}: {exc}")
    traceback.print_exc()
    raise SystemExit(1)
