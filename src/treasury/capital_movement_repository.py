from decimal import Decimal
from typing import Optional
from uuid import uuid4

from src.services.database_service import database_service


class CapitalMovementRepository:
    """
    PostgreSQL repository for capital movement requests.

    This repository persists the movement request only.

    It deliberately does NOT:
    - mutate capital account balances
    - create double-entry accounting entries
    - create approvals
    - create settlements
    - execute external transfers

    Those operations belong to later lifecycle stages.
    """

    @staticmethod
    async def get_by_idempotency_key(
        idempotency_key: str,
    ):
        return await database_service.fetchrow(
            """
            SELECT
                id,
                movement_reference,
                idempotency_key,
                movement_type,
                status,
                amount,
                currency,
                source_account_id,
                destination_account_id,
                requested_by,
                reason,
                external_reference,
                requested_at,
                approved_at,
                executing_at,
                settled_at,
                reconciled_at,
                created_at,
                updated_at
            FROM public.capital_movements
            WHERE idempotency_key = $1
            LIMIT 1
            """,
            idempotency_key,
        )

    @staticmethod
    async def get_by_id(
        movement_id: str,
    ):
        return await database_service.fetchrow(
            """
            SELECT
                id,
                movement_reference,
                idempotency_key,
                movement_type,
                status,
                amount,
                currency,
                source_account_id,
                destination_account_id,
                requested_by,
                reason,
                external_reference,
                requested_at,
                approved_at,
                executing_at,
                settled_at,
                reconciled_at,
                created_at,
                updated_at
            FROM public.capital_movements
            WHERE id = $1
            LIMIT 1
            """,
            movement_id,
        )

    @staticmethod
    async def create_request(
        *,
        movement_type: str,
        source_account_id: str,
        destination_account_id: str,
        amount: Decimal,
        currency: str,
        requested_by: int,
        reason: str,
        idempotency_key: str,
        external_reference: Optional[str] = None,
    ):
        """
        Persist a capital movement request atomically and idempotently.

        Reusing an existing idempotency key returns the already-created
        movement rather than creating a duplicate.

        No account balances or accounting entries are changed here.
        """

        movement_reference = (
            f"CAP-{uuid4().hex.upper()}"
        )

        async with database_service.transaction() as conn:
            inserted = await conn.fetchrow(
                """
                INSERT INTO public.capital_movements
                (
                    movement_reference,
                    idempotency_key,
                    movement_type,
                    status,
                    amount,
                    currency,
                    source_account_id,
                    destination_account_id,
                    requested_by,
                    reason,
                    external_reference
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    'REQUESTED',
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10
                )
                ON CONFLICT (idempotency_key) DO NOTHING
                RETURNING
                    id,
                    movement_reference,
                    idempotency_key,
                    movement_type,
                    status,
                    amount,
                    currency,
                    source_account_id,
                    destination_account_id,
                    requested_by,
                    reason,
                    external_reference,
                    requested_at,
                    approved_at,
                    executing_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                """,
                movement_reference,
                idempotency_key,
                movement_type,
                amount,
                currency,
                source_account_id,
                destination_account_id,
                requested_by,
                reason,
                external_reference,
            )

            if inserted is not None:
                return inserted

            existing = await conn.fetchrow(
                """
                SELECT
                    id,
                    movement_reference,
                    idempotency_key,
                    movement_type,
                    status,
                    amount,
                    currency,
                    source_account_id,
                    destination_account_id,
                    requested_by,
                    reason,
                    external_reference,
                    requested_at,
                    approved_at,
                    executing_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                FROM public.capital_movements
                WHERE idempotency_key = $1
                LIMIT 1
                """,
                idempotency_key,
            )

            if existing is None:
                raise RuntimeError(
                    "Capital movement idempotency conflict occurred, "
                    "but the existing movement could not be recovered."
                )

            return existing


capital_movement_repository = CapitalMovementRepository()
