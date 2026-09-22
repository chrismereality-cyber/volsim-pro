from src.services.database_service import database_service


class CapitalSettlementRepository:
    """
    PostgreSQL repository for treasury settlement records.

    Responsibility:

        EXECUTING → settlement record
        PENDING → SETTLED

    This repository records the external-execution lifecycle.
    It does NOT perform the external transfer itself.

    This repository does NOT:
    - mutate capital account balances
    - modify immutable vault state
    - execute MT5 trades
    - call external banking/blockchain APIs
    - reconcile transactions
    """

    @staticmethod
    async def get_by_movement_id(
        movement_id: str,
    ):
        movement_id = movement_id.strip()

        if not movement_id:
            raise ValueError(
                "Capital movement id is required."
            )

        return await database_service.fetchrow(
            """
            SELECT
                id,
                movement_id,
                settlement_reference,
                settlement_status,
                external_reference,
                external_account_reference,
                amount,
                currency,
                blockchain_network,
                tx_hash,
                confirmation_count,
                failure_reason,
                initiated_at,
                settled_at,
                reconciled_at,
                created_at,
                updated_at
            FROM public.capital_settlements
            WHERE movement_id = $1
            """,
            movement_id,
        )

    @staticmethod
    async def create_pending_settlement(
        movement_id: str,
        settlement_reference: str,
        amount,
        currency: str,
        external_account_reference: str | None = None,
    ):
        movement_id = movement_id.strip()
        settlement_reference = settlement_reference.strip()
        currency = currency.strip().upper()

        if not movement_id:
            raise ValueError(
                "Capital movement id is required."
            )

        if not settlement_reference:
            raise ValueError(
                "Settlement reference is required."
            )

        if amount <= 0:
            raise ValueError(
                "Settlement amount must be greater than zero."
            )

        if len(currency) != 3:
            raise ValueError(
                "Settlement currency must be a 3-letter code."
            )

        async with database_service.transaction() as conn:

            movement = await conn.fetchrow(
                """
                SELECT
                    id,
                    status,
                    amount,
                    currency
                FROM public.capital_movements
                WHERE id = $1
                FOR UPDATE
                """,
                movement_id,
            )

            if movement is None:
                raise ValueError(
                    "Capital movement does not exist."
                )

            if movement["status"] != "EXECUTING":
                raise ValueError(
                    "Capital movement is not executing: "
                    f"{movement['status']}"
                )

            if movement["amount"] != amount:
                raise ValueError(
                    "Settlement amount does not match movement amount."
                )

            if movement["currency"].strip().upper() != currency:
                raise ValueError(
                    "Settlement currency does not match movement currency."
                )

            existing = await conn.fetchrow(
                """
                SELECT
                    id,
                    movement_id,
                    settlement_reference,
                    settlement_status,
                    external_reference,
                    external_account_reference,
                    amount,
                    currency,
                    blockchain_network,
                    tx_hash,
                    confirmation_count,
                    failure_reason,
                    initiated_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                FROM public.capital_settlements
                WHERE movement_id = $1
                FOR UPDATE
                """,
                movement_id,
            )

            if existing is not None:
                return existing

            settlement = await conn.fetchrow(
                """
                INSERT INTO public.capital_settlements (
                    movement_id,
                    settlement_reference,
                    settlement_status,
                    external_account_reference,
                    amount,
                    currency,
                    confirmation_count,
                    initiated_at,
                    created_at,
                    updated_at
                )
                VALUES (
                    $1,
                    $2,
                    'PENDING',
                    $3,
                    $4,
                    $5,
                    0,
                    now(),
                    now(),
                    now()
                )
                RETURNING
                    id,
                    movement_id,
                    settlement_reference,
                    settlement_status,
                    external_reference,
                    external_account_reference,
                    amount,
                    currency,
                    blockchain_network,
                    tx_hash,
                    confirmation_count,
                    failure_reason,
                    initiated_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                """,
                movement_id,
                settlement_reference,
                external_account_reference,
                amount,
                currency,
            )

            return settlement

    @staticmethod
    async def settle_pending_settlement(
        settlement_id: str,
        external_reference: str,
        tx_hash: str | None = None,
        confirmation_count: int = 0,
    ):
        settlement_id = settlement_id.strip()
        external_reference = external_reference.strip()

        if not settlement_id:
            raise ValueError(
                "Settlement id is required."
            )

        if not external_reference:
            raise ValueError(
                "External execution reference is required."
            )

        if confirmation_count < 0:
            raise ValueError(
                "Confirmation count cannot be negative."
            )

        async with database_service.transaction() as conn:

            settlement = await conn.fetchrow(
                """
                SELECT
                    id,
                    movement_id,
                    settlement_reference,
                    settlement_status,
                    external_reference,
                    external_account_reference,
                    amount,
                    currency,
                    blockchain_network,
                    tx_hash,
                    confirmation_count,
                    failure_reason,
                    initiated_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                FROM public.capital_settlements
                WHERE id = $1
                FOR UPDATE
                """,
                settlement_id,
            )

            if settlement is None:
                raise ValueError(
                    "Capital settlement does not exist."
                )

            if settlement["settlement_status"] != "PENDING":
                raise ValueError(
                    "Capital settlement is not pending: "
                    f"{settlement['settlement_status']}"
                )

            updated = await conn.fetchrow(
                """
                UPDATE public.capital_settlements
                SET
                    settlement_status = 'SETTLED',
                    external_reference = $2,
                    tx_hash = $3,
                    confirmation_count = $4,
                    settled_at = now(),
                    updated_at = now()
                WHERE id = $1
                  AND settlement_status = 'PENDING'
                RETURNING
                    id,
                    movement_id,
                    settlement_reference,
                    settlement_status,
                    external_reference,
                    external_account_reference,
                    amount,
                    currency,
                    blockchain_network,
                    tx_hash,
                    confirmation_count,
                    failure_reason,
                    initiated_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                """,
                settlement_id,
                external_reference,
                tx_hash,
                confirmation_count,
            )

            if updated is None:
                raise RuntimeError(
                    "Capital settlement could not be marked SETTLED."
                )

            movement = await conn.fetchrow(
                """
                UPDATE public.capital_movements
                SET
                    status = 'SETTLED',
                    settled_at = now(),
                    updated_at = now()
                WHERE id = $1
                  AND status = 'EXECUTING'
                RETURNING
                    id,
                    movement_reference,
                    status,
                    amount,
                    currency,
                    settled_at
                """,
                settlement["movement_id"],
            )

            if movement is None:
                raise RuntimeError(
                    "Capital movement could not be marked SETTLED."
                )

            return updated, movement


capital_settlement_repository = CapitalSettlementRepository()
