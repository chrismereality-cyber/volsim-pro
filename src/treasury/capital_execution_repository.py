from src.services.database_service import database_service


class CapitalExecutionRepository:
    """
    PostgreSQL repository for treasury execution claims.

    Responsibility:

        APPROVED → EXECUTING

    The transition is atomic and protected by a PostgreSQL row lock.

    This repository does NOT:
    - mutate capital account balances
    - modify immutable vault state
    - execute MT5 trades
    - execute external transfers
    - create settlement records
    - reconcile transactions
    """

    @staticmethod
    async def claim_approved_movement(
        movement_id: str,
    ):
        """
        Atomically claim one approved capital movement for execution.

        Guarantees:
        - the movement must exist
        - the movement must currently be APPROVED
        - the movement row is locked FOR UPDATE
        - only one execution worker can claim the movement
        - APPROVED → EXECUTING occurs in the same transaction

        No balances or settlement records are modified.
        """

        movement_id = movement_id.strip()

        if not movement_id:
            raise ValueError(
                "Capital movement id is required."
            )

        async with database_service.transaction() as conn:

            movement = await conn.fetchrow(
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
                FOR UPDATE
                """,
                movement_id,
            )

            if movement is None:
                raise ValueError(
                    "Capital movement does not exist."
                )

            if movement["status"] != "APPROVED":
                raise ValueError(
                    "Capital movement is not approved for execution: "
                    f"{movement['status']}"
                )

            claimed = await conn.fetchrow(
                """
                UPDATE public.capital_movements
                SET
                    status = 'EXECUTING',
                    executing_at = now(),
                    updated_at = now()
                WHERE id = $1
                  AND status = 'APPROVED'
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
                movement_id,
            )

            if claimed is None:
                raise RuntimeError(
                    "Capital movement could not be claimed for execution."
                )

            return claimed


capital_execution_repository = CapitalExecutionRepository()
