from decimal import Decimal
from typing import Sequence

from src.services.database_service import database_service


class CapitalAccountRepository:
    """
    PostgreSQL repository for Treasury capital accounts.

    Supports explicit account bootstrap and read/locking operations.

    This repository does NOT import balances from:
    - immutable_vault_state
    - vault_ledger
    - wallet_accounts
    - wallet_ledger
    - trading execution state
    """

    @staticmethod
    async def get_by_id(
        account_id: str,
        *,
        for_update: bool = False,
    ):
        query = """
            SELECT
                id,
                account_code,
                account_type,
                currency,
                balance,
                reserved_balance,
                is_active,
                created_at,
                updated_at
            FROM public.capital_accounts
            WHERE id = $1
        """

        if for_update:
            query += " FOR UPDATE"

        return await database_service.fetchrow(
            query,
            account_id,
        )

    @staticmethod
    async def get_by_code(
        account_code: str,
        *,
        for_update: bool = False,
    ):
        query = """
            SELECT
                id,
                account_code,
                account_type,
                currency,
                balance,
                reserved_balance,
                is_active,
                created_at,
                updated_at
            FROM public.capital_accounts
            WHERE account_code = $1
        """

        if for_update:
            query += " FOR UPDATE"

        return await database_service.fetchrow(
            query,
            account_code,
        )

    @staticmethod
    async def list_active():
        return await database_service.fetch(
            """
            SELECT
                id,
                account_code,
                account_type,
                currency,
                balance,
                reserved_balance,
                is_active,
                created_at,
                updated_at
            FROM public.capital_accounts
            WHERE is_active = TRUE
            ORDER BY account_code
            """
        )

    @staticmethod
    async def account_exists(
        account_code: str,
    ) -> bool:
        row = await database_service.fetchrow(
            """
            SELECT 1
            FROM public.capital_accounts
            WHERE account_code = $1
            LIMIT 1
            """,
            account_code,
        )

        return row is not None

    @staticmethod
    async def create_accounts(
        accounts: Sequence[dict],
    ):
        """
        Atomically create a batch of Treasury capital accounts.

        Every account must be supplied explicitly.

        The entire transaction rolls back if any account cannot
        be created.

        No existing financial state is imported or modified.
        """

        if not accounts:
            raise ValueError(
                "At least one capital account is required."
            )

        async with database_service.transaction() as conn:
            created = []

            for account in accounts:
                row = await conn.fetchrow(
                    """
                    INSERT INTO public.capital_accounts
                    (
                        account_code,
                        account_type,
                        currency,
                        balance,
                        reserved_balance,
                        is_active
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        0,
                        TRUE
                    )
                    RETURNING
                        id,
                        account_code,
                        account_type,
                        currency,
                        balance,
                        reserved_balance,
                        is_active,
                        created_at,
                        updated_at
                    """,
                    account["account_code"],
                    account["account_type"],
                    account["currency"],
                    account["opening_balance"],
                )

                created.append(row)

            return created


capital_account_repository = CapitalAccountRepository()
