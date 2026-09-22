from decimal import Decimal

from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_approval_repository import (
    capital_approval_repository,
)
from src.treasury.capital_execution_repository import (
    capital_execution_repository,
)
from src.treasury.capital_movement_entry_repository import (
    capital_movement_entry_repository,
)
from src.treasury.capital_movement_repository import (
    capital_movement_repository,
)


class CapitalExecutionService:
    """
    Service layer for controlled treasury execution.

    Responsibility:

        APPROVED → EXECUTING

    This service validates authorization, approval integrity,
    accounting-entry integrity, and separation of duties before
    atomically claiming a movement for execution.

    This service does NOT:
    - execute external bank transfers
    - execute blockchain transfers
    - execute MT5 trades
    - mutate capital account balances
    - modify immutable vault state
    - create settlement records
    - reconcile transactions
    """

    @staticmethod
    async def execute(
        context: AuthorizationContext,
        movement_id: str,
    ):
        """
        Validate and atomically claim an approved capital movement.

        The resulting status is EXECUTING.

        EXECUTING does not mean that an external transfer has
        occurred. External execution belongs to the settlement/
        execution-adapter layer.
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

        if movement["status"] != "APPROVED":
            raise ValueError(
                "Capital movement is not approved for execution: "
                f"{movement['status']}"
            )

        requester_id = movement["requested_by"]

        try:
            executor_user_id = int(
                context.identity.user_id
            )
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Execution identity user id must be a valid integer."
            ) from exc

        if executor_user_id <= 0:
            raise ValueError(
                "Execution identity user id must be positive."
            )

        if requester_id == executor_user_id:
            raise PermissionError(
                "The requester cannot execute their own capital movement."
            )

        approvals = (
            await capital_approval_repository.get_by_movement_id(
                movement_id
            )
        )

        approved_by_authorized_approver = False

        for approval in approvals or []:
            if approval["decision"] != "APPROVED":
                continue

            approver_user_id = approval["approver_user_id"]

            if approver_user_id == requester_id:
                raise PermissionError(
                    "The movement requester cannot be the approving user."
                )

            approved_by_authorized_approver = True

        if not approved_by_authorized_approver:
            raise ValueError(
                "Capital movement has no valid APPROVED authorization."
            )

        entries = (
            await capital_movement_entry_repository.list_by_movement_id(
                movement_id
            )
        )

        if len(entries) != 2:
            raise ValueError(
                "Capital movement must contain exactly two "
                "accounting entries before execution."
            )

        debit_entries = [
            entry
            for entry in entries
            if entry["entry_type"] == "DEBIT"
        ]

        credit_entries = [
            entry
            for entry in entries
            if entry["entry_type"] == "CREDIT"
        ]

        if len(debit_entries) != 1:
            raise ValueError(
                "Capital movement must contain exactly one DEBIT entry."
            )

        if len(credit_entries) != 1:
            raise ValueError(
                "Capital movement must contain exactly one CREDIT entry."
            )

        debit = debit_entries[0]
        credit = credit_entries[0]

        amount = Decimal(str(movement["amount"]))
        currency = str(movement["currency"]).strip().upper()

        if Decimal(str(debit["amount"])) != amount:
            raise ValueError(
                "DEBIT entry amount does not match movement amount."
            )

        if Decimal(str(credit["amount"])) != amount:
            raise ValueError(
                "CREDIT entry amount does not match movement amount."
            )

        if str(debit["currency"]).strip().upper() != currency:
            raise ValueError(
                "DEBIT entry currency does not match movement currency."
            )

        if str(credit["currency"]).strip().upper() != currency:
            raise ValueError(
                "CREDIT entry currency does not match movement currency."
            )

        if debit["account_id"] != movement["destination_account_id"]:
            raise ValueError(
                "DEBIT entry must target the movement destination account."
            )

        if credit["account_id"] != movement["source_account_id"]:
            raise ValueError(
                "CREDIT entry must reference the movement source account."
            )

        claimed = (
            await capital_execution_repository.claim_approved_movement(
                movement_id
            )
        )

        return claimed


capital_execution_service = CapitalExecutionService()
