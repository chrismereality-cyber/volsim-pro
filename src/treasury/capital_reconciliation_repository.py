from src.services.database_service import database_service


class CapitalReconciliationRepository:
    """
    PostgreSQL repository for treasury reconciliation.

    Responsibility:

        SETTLED ? RECONCILED

    The movement and settlement transitions are performed
    atomically inside one PostgreSQL transaction.

    This repository does NOT:
    - mutate capital account balances
    - modify immutable vault state
    - execute external transfers
    - execute MT5 trades
    - modify accounting entries
    """

    @staticmethod
    async def reconcile_settled_movement(
        movement_id: str,
    ):
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
                    movement_type,
                    status,
                    amount,
                    currency,
                    source_account_id,
                    destination_account_id,
                    requested_by,
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

            if movement["status"] != "SETTLED":
                raise ValueError(
                    "Capital movement is not settled for reconciliation: "
                    f"{movement['status']}"
                )

            if movement["reconciled_at"] is not None:
                raise ValueError(
                    "Capital movement is already reconciled."
                )

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
                WHERE movement_id = $1
                FOR UPDATE
                """,
                movement_id,
            )

            if settlement is None:
                raise ValueError(
                    "Capital settlement does not exist."
                )

            if settlement["settlement_status"] != "SETTLED":
                raise ValueError(
                    "Capital settlement is not settled for reconciliation: "
                    f"{settlement['settlement_status']}"
                )

            if settlement["reconciled_at"] is not None:
                raise ValueError(
                    "Capital settlement is already reconciled."
                )

            if settlement["amount"] != movement["amount"]:
                raise ValueError(
                    "Settlement amount does not match movement amount."
                )

            if (
                settlement["currency"].strip().upper()
                != movement["currency"].strip().upper()
            ):
                raise ValueError(
                    "Settlement currency does not match movement currency."
                )

            if not settlement["external_reference"]:
                raise ValueError(
                    "Settled capital movement requires an external reference."
                )

            reconciled_settlement = await conn.fetchrow(
                """
                UPDATE public.capital_settlements
                SET
                    settlement_status = 'RECONCILED',
                    reconciled_at = now(),
                    updated_at = now()
                WHERE id = $1
                  AND settlement_status = 'SETTLED'
                  AND reconciled_at IS NULL
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
                settlement["id"],
            )

            if reconciled_settlement is None:
                raise RuntimeError(
                    "Capital settlement could not be reconciled."
                )

            reconciled_movement = await conn.fetchrow(
                """
                UPDATE public.capital_movements
                SET
                    status = 'RECONCILED',
                    reconciled_at = now(),
                    updated_at = now()
                WHERE id = $1
                  AND status = 'SETTLED'
                  AND reconciled_at IS NULL
                RETURNING
                    id,
                    movement_reference,
                    movement_type,
                    status,
                    amount,
                    currency,
                    source_account_id,
                    destination_account_id,
                    requested_by,
                    approved_at,
                    executing_at,
                    settled_at,
                    reconciled_at,
                    created_at,
                    updated_at
                """,
                movement_id,
            )

            if reconciled_movement is None:
                raise RuntimeError(
                    "Capital movement could not be reconciled."
                )

            return (
                reconciled_movement,
                reconciled_settlement,
            )


capital_reconciliation_repository = (
    CapitalReconciliationRepository()
)
