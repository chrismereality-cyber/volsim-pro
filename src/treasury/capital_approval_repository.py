from typing import Optional

from src.services.database_service import database_service


class CapitalApprovalRepository:
    """
    PostgreSQL repository for capital movement approval decisions.

    This repository persists approval decisions and, when requested,
    transitions the associated movement status atomically.

    It does NOT:
    - mutate capital account balances
    - execute external transfers
    - create settlements
    - reconcile external transactions
    - modify immutable vault state
    """

    @staticmethod
    async def get_by_movement_id(
        movement_id: str,
    ):
        return await database_service.fetchrow(
            """
            SELECT
                id,
                movement_id,
                approver_user_id,
                decision,
                reason,
                created_at
            FROM public.capital_approvals
            WHERE movement_id = $1
            LIMIT 1
            """,
            movement_id,
        )

    @staticmethod
    async def get_by_movement_and_approver(
        movement_id: str,
        approver_user_id: int,
    ):
        return await database_service.fetchrow(
            """
            SELECT
                id,
                movement_id,
                approver_user_id,
                decision,
                reason,
                created_at
            FROM public.capital_approvals
            WHERE movement_id = $1
              AND approver_user_id = $2
            LIMIT 1
            """,
            movement_id,
            approver_user_id,
        )

    @staticmethod
    async def create_decision(
        *,
        movement_id: str,
        approver_user_id: int,
        decision: str,
        reason: Optional[str],
        movement_status: str,
    ):
        """
        Atomically persist one approval decision and transition
        the associated capital movement.

        The caller must already have validated:
        - authorization
        - separation of duties
        - movement state
        - decision
        - reason requirements

        No capital account balances are changed.
        """

        async with database_service.transaction() as conn:

            movement = await conn.fetchrow(
                """
                SELECT
                    id,
                    status,
                    requested_by
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

            existing = await conn.fetchrow(
                """
                SELECT
                    id,
                    movement_id,
                    approver_user_id,
                    decision,
                    reason,
                    created_at
                FROM public.capital_approvals
                WHERE movement_id = $1
                LIMIT 1
                """,
                movement_id,
            )

            if existing is not None:
                return existing

            if movement["status"] not in {
                "REQUESTED",
                "PENDING_APPROVAL",
            }:
                raise ValueError(
                    "Capital movement is not awaiting approval: "
                    f"{movement['status']}"
                )

            inserted = await conn.fetchrow(
                """
                INSERT INTO public.capital_approvals
                (
                    movement_id,
                    approver_user_id,
                    decision,
                    reason
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )
                RETURNING
                    id,
                    movement_id,
                    approver_user_id,
                    decision,
                    reason,
                    created_at
                """,
                movement_id,
                approver_user_id,
                decision,
                reason,
            )

            if inserted is None:
                raise RuntimeError(
                    "Capital approval could not be persisted."
                )

            await conn.execute(
                """
                UPDATE public.capital_movements
                SET
                    status = $2::varchar,
                    approved_at = CASE
                        WHEN $2::varchar = 'APPROVED'
                        THEN now()
                        ELSE approved_at
                    END,
                    updated_at = now()
                WHERE id = $1
                """,
                movement_id,
                movement_status,
            )

            return inserted


capital_approval_repository = CapitalApprovalRepository()
