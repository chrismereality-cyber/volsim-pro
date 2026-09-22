from decimal import Decimal
from typing import Sequence

from src.services.database_service import database_service


class CapitalMovementEntryRepository:
    """
    PostgreSQL repository for capital movement double-entry records.

    This repository creates accounting entries only.

    It does NOT:
    - mutate capital account balances
    - approve movements
    - execute transfers
    - create settlements
    - reconcile external transactions
    """

    @staticmethod
    async def list_by_movement_id(
        movement_id: str,
    ):
        return await database_service.fetch(
            """
            SELECT
                id,
                movement_id,
                account_id,
                entry_type,
                amount,
                currency,
                created_at
            FROM public.capital_movement_entries
            WHERE movement_id = $1
            ORDER BY id
            """,
            movement_id,
        )

    @staticmethod
    async def create_entries(
        *,
        movement_id: str,
        entries: Sequence[dict],
    ):
        """
        Atomically create all accounting entries for one movement.

        The caller must provide a complete balanced entry set.

        This method does NOT mutate capital account balances.
        """

        if not entries:
            raise ValueError(
                "At least one accounting entry is required."
            )

        async with database_service.transaction() as conn:
            created = []

            for entry in entries:
                row = await conn.fetchrow(
                    """
                    INSERT INTO public.capital_movement_entries
                    (
                        movement_id,
                        account_id,
                        entry_type,
                        amount,
                        currency
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                    RETURNING
                        id,
                        movement_id,
                        account_id,
                        entry_type,
                        amount,
                        currency,
                        created_at
                    """,
                    movement_id,
                    entry["account_id"],
                    entry["entry_type"],
                    entry["amount"],
                    entry["currency"],
                )

                created.append(row)

            return created


capital_movement_entry_repository = CapitalMovementEntryRepository()
