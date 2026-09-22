from dataclasses import dataclass
from decimal import Decimal
from typing import Final

from src.accounting.accounting_invariants import (
    validate_currency,
    validate_distinct_accounts,
    validate_positive_amount,
)
from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_account_repository import (
    capital_account_repository,
)
from src.treasury.capital_movement_repository import (
    capital_movement_repository,
)
from src.treasury.movement_policy import (
    get_movement_rule,
    validate_account_types,
)


MOVEMENT_STATUSES: Final[frozenset[str]] = frozenset({
    "REQUESTED",
    "VALIDATED",
    "PENDING_APPROVAL",
    "APPROVED",
    "EXECUTING",
    "SETTLED",
    "RECONCILED",
    "REJECTED",
    "CANCELLED",
    "FAILED",
    "REVERSED",
})


@dataclass(frozen=True)
class CapitalMovementRequest:
    movement_type: str
    source_account_id: str
    source_account_type: str
    destination_account_id: str
    destination_account_type: str
    amount: Decimal
    currency: str
    requested_by: int
    reason: str
    idempotency_key: str


class CapitalMovementService:
    """
    Domain service for controlled institutional capital movements.

    Lifecycle responsibility at this stage:

        REQUEST
          ↓
        VALIDATE
          ↓
        PERSIST MOVEMENT

    This service deliberately does NOT:
    - mutate capital account balances
    - create double-entry entries
    - approve movements
    - execute transfers
    - create settlements
    - reconcile external transactions
    """

    @staticmethod
    def validate_request(
        request: CapitalMovementRequest,
        context: AuthorizationContext,
    ) -> None:
        require_permission(context, "capital.request")

        if request.requested_by <= 0:
            raise ValueError(
                "requested_by must be a positive user id."
            )

        if not request.reason.strip():
            raise ValueError(
                "Capital movement reason is required."
            )

        if not request.idempotency_key.strip():
            raise ValueError(
                "Idempotency key is required."
            )

        validate_positive_amount(request.amount)

        validate_currency(request.currency)

        validate_distinct_accounts(
            request.source_account_id,
            request.destination_account_id,
        )

        validate_account_types(
            request.movement_type,
            request.source_account_type,
            request.destination_account_type,
        )

        get_movement_rule(request.movement_type)

    @staticmethod
    async def request_movement(
        request: CapitalMovementRequest,
        context: AuthorizationContext,
    ):
        """
        Validate and persist a capital movement request.

        Account identity and account type are verified against PostgreSQL
        before persistence.

        This method does NOT modify account balances.
        """

        CapitalMovementService.validate_request(
            request,
            context,
        )

        source_account = (
            await capital_account_repository.get_by_id(
                request.source_account_id,
            )
        )

        if source_account is None:
            raise ValueError(
                "Source capital account does not exist."
            )

        destination_account = (
            await capital_account_repository.get_by_id(
                request.destination_account_id,
            )
        )

        if destination_account is None:
            raise ValueError(
                "Destination capital account does not exist."
            )

        if not source_account["is_active"]:
            raise ValueError(
                "Source capital account is inactive."
            )

        if not destination_account["is_active"]:
            raise ValueError(
                "Destination capital account is inactive."
            )

        if source_account["account_type"] != request.source_account_type:
            raise ValueError(
                "Source account type does not match the database."
            )

        if (
            destination_account["account_type"]
            != request.destination_account_type
        ):
            raise ValueError(
                "Destination account type does not match the database."
            )

        if source_account["currency"] != request.currency:
            raise ValueError(
                "Source account currency does not match movement currency."
            )

        if destination_account["currency"] != request.currency:
            raise ValueError(
                "Destination account currency does not match movement currency."
            )

        movement_rule = get_movement_rule(
            request.movement_type,
        )

        if source_account["account_type"] != movement_rule.source_type:
            raise ValueError(
                "Source account violates the movement policy."
            )

        if (
            destination_account["account_type"]
            != movement_rule.destination_type
        ):
            raise ValueError(
                "Destination account violates the movement policy."
            )

        return await capital_movement_repository.create_request(
            movement_type=request.movement_type,
            source_account_id=str(source_account["id"]),
            destination_account_id=str(destination_account["id"]),
            amount=request.amount,
            currency=request.currency.strip().upper(),
            requested_by=request.requested_by,
            reason=request.reason.strip(),
            idempotency_key=request.idempotency_key.strip(),
        )

    @staticmethod
    def initial_status() -> str:
        return "REQUESTED"


capital_movement_service = CapitalMovementService()
