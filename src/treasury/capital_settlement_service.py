from decimal import Decimal
from uuid import uuid4

from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_movement_repository import (
    capital_movement_repository,
)
from src.treasury.capital_settlement_repository import (
    capital_settlement_repository,
)


class CapitalSettlementService:
    """
    Service layer for treasury settlement lifecycle.

    Responsibilities:

        EXECUTING → PENDING settlement
        PENDING → SETTLED settlement

    This service records settlement lifecycle state.
    It does NOT execute the external transfer itself.

    This service does NOT:
    - execute bank transfers
    - execute blockchain transactions
    - execute MT5 trades
    - mutate capital account balances
    - modify immutable vault state
    - mark settlements RECONCILED
    - perform independent reconciliation
    """

    @staticmethod
    async def create_pending_settlement(
        context: AuthorizationContext,
        movement_id: str,
        external_account_reference: str | None = None,
    ):
        """
        Create or recover the single settlement record for an
        EXECUTING capital movement.

        The resulting settlement status is PENDING.

        The operation is idempotent at the movement level because
        capital_settlements.movement_id is UNIQUE.
        """

        require_permission(
            context,
            "capital.execute",
        )

        movement_id = movement_id.strip()

        if not movement_id:
            raise ValueError(
                "Capital movement id is required."
            )

        movement = await capital_movement_repository.get_by_id(
            movement_id
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

        amount = Decimal(
            str(movement["amount"])
        )

        currency = str(
            movement["currency"]
        ).strip().upper()

        settlement_reference = (
            f"SET-{uuid4().hex.upper()}"
        )

        return await (
            capital_settlement_repository.create_pending_settlement(
                movement_id=movement_id,
                settlement_reference=settlement_reference,
                amount=amount,
                currency=currency,
                external_account_reference=(
                    external_account_reference.strip()
                    if external_account_reference
                    else None
                ),
            )
        )

    @staticmethod
    async def settle_pending_settlement(
        context: AuthorizationContext,
        settlement_id: str,
        external_reference: str,
        tx_hash: str | None = None,
        confirmation_count: int = 0,
    ):
        """
        Mark a PENDING settlement as SETTLED using externally
        supplied execution evidence.

        This does not execute the external transfer itself.
        """

        require_permission(
            context,
            "capital.execute",
        )

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

        result = await (
            capital_settlement_repository
            .settle_pending_settlement(
                settlement_id=settlement_id,
                external_reference=external_reference,
                tx_hash=(
                    tx_hash.strip()
                    if tx_hash
                    else None
                ),
                confirmation_count=confirmation_count,
            )
        )

        return result


capital_settlement_service = CapitalSettlementService()
