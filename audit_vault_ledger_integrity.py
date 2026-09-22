import asyncio
from src.services.database_service import database_service

async def main():
    conn = await database_service.connect()

    total = await conn.fetchval(
        """
        SELECT COUNT(*)
        FROM public.vault_ledger
        """
    )

    legacy = await conn.fetchval(
        """
        SELECT COUNT(*)
        FROM public.vault_ledger
        WHERE equity_amount IS NULL
           OR vault_amount IS NULL
           OR allocation_profile IS NULL
        """
    )

    current = await conn.fetchval(
        """
        SELECT COUNT(*)
        FROM public.vault_ledger
        WHERE trade_id LIKE 'VAULT-PROFIT-%'
        """
    )

    duplicates = await conn.fetch(
        """
        SELECT trade_id, COUNT(*) AS occurrences
        FROM public.vault_ledger
        GROUP BY trade_id
        HAVING COUNT(*) > 1
        ORDER BY occurrences DESC, trade_id
        """
    )

    invalid_current = await conn.fetch(
        """
        SELECT
            id,
            trade_id,
            equity_amount,
            vault_amount,
            allocation_profile
        FROM public.vault_ledger
        WHERE trade_id LIKE 'VAULT-PROFIT-%'
          AND (
              equity_amount IS NULL
              OR vault_amount IS NULL
              OR allocation_profile IS NULL
              OR allocation_profile <> 'CORE_SATELLITE_70_30'
              OR ROUND(equity_amount + vault_amount, 2) = 0
          )
        ORDER BY id
        """
    )

    print("=== VAULT LEDGER INTEGRITY AUDIT ===")
    print("TOTAL ROWS:", total)
    print("LEGACY/INCOMPLETE ROWS:", legacy)
    print("CURRENT VAULT-PROFIT ROWS:", current)
    print("DUPLICATE TRADE IDS:", len(duplicates))
    print("INVALID CURRENT ROWS:", len(invalid_current))

    if duplicates:
        print("\n=== DUPLICATES ===")
        for row in duplicates:
            print(dict(row))

    if invalid_current:
        print("\n=== INVALID CURRENT RECORDS ===")
        for row in invalid_current:
            print(dict(row))

asyncio.run(main())
