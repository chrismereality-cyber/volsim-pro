import asyncio
import sys
from pathlib import Path

# --------------------------------------------------------------
# Project root
# --------------------------------------------------------------

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# --------------------------------------------------------------
# Use VolSim-Pro's own database service.
#
# This is intentional.
# We do NOT read DATABASE_URL directly here.
# database_service already handles project configuration.
# --------------------------------------------------------------

from src.services.database_service import database_service


async def fetch_scalar(conn, query, *args):
    return await conn.fetchval(query, *args)


async def main():

    print("=" * 62)
    print("VOLSIM-PRO EXECUTION IDEMPOTENCY DATABASE AUDIT")
    print("=" * 62)

    # ----------------------------------------------------------
    # 1. Verify application database configuration
    # ----------------------------------------------------------

    if not database_service.database_url:
        print("FAIL - database_service has no DATABASE_URL.")
        return 1

    print("PASS - application database configuration loaded.")

    # ----------------------------------------------------------
    # 2. Connect through the actual application service
    # ----------------------------------------------------------

    try:
        pool = await database_service.connect()
        print("PASS - PostgreSQL connection established.")
    except Exception as e:
        print("FAIL - PostgreSQL connection failed.")
        print(f"ERROR: {e}")
        return 1

    # ----------------------------------------------------------
    # 3. Database identity
    # ----------------------------------------------------------

    async with pool.acquire() as conn:

        print("")
        print("===== DATABASE IDENTITY =====")

        version = await fetch_scalar(
            conn,
            "SELECT version()"
        )

        current_database = await fetch_scalar(
            conn,
            "SELECT current_database()"
        )

        current_user = await fetch_scalar(
            conn,
            "SELECT current_user"
        )

        print(f"Database: {current_database}")
        print(f"User:     {current_user}")
        print(f"Version:  {version}")

        # ------------------------------------------------------
        # 4. Required execution_idempotency table
        # ------------------------------------------------------

        print("")
        print("===== EXECUTION IDEMPOTENCY TABLE =====")

        table_exists = await fetch_scalar(
            conn,
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name = 'execution_idempotency'
            )
            """
        )

        if not table_exists:
            print("FAIL - execution_idempotency table does not exist.")
            return 1

        print("PASS - execution_idempotency table exists.")

        # ------------------------------------------------------
        # 5. Required columns
        # ------------------------------------------------------

        required_columns = {
            "client_order_id",
            "oms_order_id",
            "execution_mode",
            "status",
            "broker_order_ticket",
            "broker_deal_ticket",
            "broker_position_ticket",
            "retcode",
            "result",
            "created_at",
            "updated_at",
        }

        rows = await conn.fetch(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'execution_idempotency'
            """
        )

        actual_columns = {
            row["column_name"]
            for row in rows
        }

        print("")
        print("Required columns:")

        missing_columns = []

        for column in sorted(required_columns):
            if column in actual_columns:
                print(f"  PASS  {column}")
            else:
                print(f"  FAIL  {column}")
                missing_columns.append(column)

        if missing_columns:
            print("")
            print("FAIL - required columns are missing.")
            return 1

        # ------------------------------------------------------
        # 6. Primary key / unique protection
        # ------------------------------------------------------

        print("")
        print("===== IDEMPOTENCY CONSTRAINT =====")

        constraints = await conn.fetch(
            """
            SELECT
                tc.constraint_name,
                tc.constraint_type,
                kcu.column_name
            FROM information_schema.table_constraints tc
            LEFT JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
               AND tc.table_schema = kcu.table_schema
            WHERE tc.table_schema = 'public'
              AND tc.table_name = 'execution_idempotency'
            ORDER BY tc.constraint_name
            """
        )

        protected = False

        for row in constraints:
            print(
                f"  {row['constraint_type']}: "
                f"{row['constraint_name']} "
                f"({row['column_name']})"
            )

            if (
                row["column_name"] == "client_order_id"
                and row["constraint_type"] in {
                    "PRIMARY KEY",
                    "UNIQUE",
                }
            ):
                protected = True

        if not protected:
            print("")
            print(
                "FAIL - client_order_id is not protected by "
                "PRIMARY KEY or UNIQUE constraint."
            )
            return 1

        print("")
        print(
            "PASS - client_order_id has durable database-level "
            "uniqueness protection."
        )

        # ------------------------------------------------------
        # 7. Inspect current execution records
        # ------------------------------------------------------

        print("")
        print("===== CURRENT EXECUTION IDEMPOTENCY RECORDS =====")

        count = await fetch_scalar(
            conn,
            """
            SELECT COUNT(*)
            FROM execution_idempotency
            """
        )

        print(f"Rows currently stored: {count}")

        # ------------------------------------------------------
        # 8. Detect unfinished executions
        # ------------------------------------------------------

        print("")
        print("===== IN-PROGRESS EXECUTIONS =====")

        in_progress = await conn.fetch(
            """
            SELECT
                client_order_id,
                oms_order_id,
                execution_mode,
                status,
                broker_order_ticket,
                broker_deal_ticket,
                broker_position_ticket,
                created_at,
                updated_at
            FROM execution_idempotency
            WHERE status = 'IN_PROGRESS'
            ORDER BY created_at DESC
            """
        )

        if not in_progress:
            print("PASS - no IN_PROGRESS execution records found.")
        else:
            print(
                f"WARNING - {len(in_progress)} "
                "IN_PROGRESS execution record(s) found."
            )

            for row in in_progress:
                print(
                    "  "
                    f"client_order_id={row['client_order_id']} "
                    f"oms_order_id={row['oms_order_id']} "
                    f"mode={row['execution_mode']} "
                    f"status={row['status']} "
                    f"broker_order_ticket={row['broker_order_ticket']} "
                    f"broker_deal_ticket={row['broker_deal_ticket']} "
                    f"broker_position_ticket={row['broker_position_ticket']}"
                )

        # ------------------------------------------------------
        # 9. Inspect table definition
        # ------------------------------------------------------

        print("")
        print("===== EXECUTION IDEMPOTENCY SCHEMA =====")

        schema_rows = await conn.fetch(
            """
            SELECT
                ordinal_position,
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'execution_idempotency'
            ORDER BY ordinal_position
            """
        )

        for row in schema_rows:
            print(
                f"  {row['ordinal_position']}: "
                f"{row['column_name']} "
                f"{row['data_type']} "
                f"nullable={row['is_nullable']}"
            )

    # ----------------------------------------------------------
    # 10. Final result
    # ----------------------------------------------------------

    print("")
    print("=" * 62)
    print("DATABASE AUDIT PASSED")
    print("=" * 62)
    print("")
    print("Application-native database configuration: PASS")
    print("PostgreSQL connection: PASS")
    print("execution_idempotency table: PASS")
    print("Required columns: PASS")
    print("client_order_id uniqueness: PASS")
    print("")
    print("No live order was transmitted by this audit.")

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
