from dataclasses import dataclass
from decimal import Decimal

from src.accounting.accounting_invariants import (
    validate_balanced_entries,
    validate_currency,
    validate_distinct_accounts,
    validate_positive_amount,
)
from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_account_repository import (
    capital_account_repository,
)
from src.treasury.capital_movement_entry_repository import (
    capital_movement_entry_repository,
)
from src.treasury.capital_movement_repository import (
    capital_movement_repository,
)
from src.treasury.movement_policy import (
    get_movement_rule,
    validate_account_types,
)


@dataclass(frozen=True)
class AccountingEntryRequest:
    movement_id: str
    movement_type: str
    source_account_id: str
    destination_account_id: str
    amount: Decimal
    currency: str


class CapitalMovementAccountingService:
    """
    Creates double-entry accounting records for an existing
    capital movement.

    Current responsibility:

        MOVEMENT
          ↓
        VALIDATE ACCOUNTING
          ↓
        CREATE DEBIT + CREDIT ENTRIES

    This service deliberately does NOT:
    - mutate capital account balances
    - approve movements
    - execute external transfers
    - create settlements
    - reconcile external transactions
    """

    @staticmethod
    def validate_request(
        request: AccountingEntryRequest,
        context: AuthorizationContext,
    ) -> None:
        require_permission(context, "capital.manage")

        validate_positive_amount(request.amount)
        validate_currency(request.currency)

        validate_distinct_accounts(
            request.source_account_id,
            request.destination_account_id,
        )

        get_movement_rule(request.movement_type)

    @staticmethod
    async def create_entries(
        request: AccountingEntryRequest,
        context: AuthorizationContext,
    ):
        """
        Validate an existing capital movement and create its
        complete double-entry accounting record.

        The source account receives the CREDIT.

        The destination account receives the DEBIT.

        No account balances are changed.
        """

        CapitalMovementAccountingService.validate_request(
            request,
            context,
        )

        movement = await capital_movement_repository.get_by_id(
            request.movement_id,
        )

        if movement is None:
            raise ValueError(
                "Capital movement does not exist."
            )

        if movement["movement_type"] != request.movement_type:
            raise ValueError(
                "Accounting movement type does not match the database movement."
            )

        if str(movement["source_account_id"]) != request.source_account_id:
            raise ValueError(
                "Accounting source account does not match the database movement."
            )

        if str(movement["destination_account_id"]) != request.destination_account_id:
            raise ValueError(
                "Accounting destination account does not match the database movement."
            )

        if Decimal(str(movement["amount"])) != request.amount:
            raise ValueError(
                "Accounting amount does not match the database movement."
            )

        if movement["currency"].strip().upper() != request.currency.strip().upper():
            raise ValueError(
                "Accounting currency does not match the database movement."
            )

        source_account = await capital_account_repository.get_by_id(
            request.source_account_id,
        )

        destination_account = await capital_account_repository.get_by_id(
            request.destination_account_id,
        )

        if source_account is None:
            raise ValueError(
                "Source capital account does not exist."
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

        source_type = source_account["account_type"]
        destination_type = destination_account["account_type"]

        validate_account_types(
            request.movement_type,
            source_type,
            destination_type,
        )

        source_currency = source_account["currency"].strip().upper()
        destination_currency = destination_account["currency"].strip().upper()
        movement_currency = request.currency.strip().upper()

        validate_currency(
            source_currency,
            destination_currency,
            movement_currency,
        )

        existing_entries = (
            await capital_movement_entry_repository.list_by_movement_id(
                request.movement_id,
            )
        )

        if existing_entries:
            if len(existing_entries) != 2:
                raise RuntimeError(
                    "Existing capital movement accounting record is incomplete."
                )

            debit_entries = [
                entry
                for entry in existing_entries
                if entry["entry_type"] == "DEBIT"
            ]

            credit_entries = [
                entry
                for entry in existing_entries
                if entry["entry_type"] == "CREDIT"
            ]

            if len(debit_entries) != 1 or len(credit_entries) != 1:
                raise RuntimeError(
                    "Existing capital movement accounting record is not "
                    "exactly one debit and one credit."
                )

            debit = debit_entries[0]
            credit = credit_entries[0]

            if str(debit["account_id"]) != request.destination_account_id:
                raise RuntimeError(
                    "Existing debit entry does not point to the destination account."
                )

            if str(credit["account_id"]) != request.source_account_id:
                raise RuntimeError(
                    "Existing credit entry does not point to the source account."
                )

            debit_amount = Decimal(str(debit["amount"]))
            credit_amount = Decimal(str(credit["amount"]))

            validate_balanced_entries(
                debit_amount,
                credit_amount,
            )

            if debit_amount != request.amount:
                raise RuntimeError(
                    "Existing accounting entry amount does not match movement amount."
                )

            validate_currency(
                debit["currency"],
                credit["currency"],
                request.currency,
            )

            return existing_entries

        entries = [
            {
                "account_id": request.destination_account_id,
                "entry_type": "DEBIT",
                "amount": request.amount,
                "currency": movement_currency,
            },
            {
                "account_id": request.source_account_id,
                "entry_type": "CREDIT",
                "amount": request.amount,
                "currency": movement_currency,
            },
        ]

        debit_total = sum(
            entry["amount"]
            for entry in entries
            if entry["entry_type"] == "DEBIT"
        )

        credit_total = sum(
            entry["amount"]
            for entry in entries
            if entry["entry_type"] == "CREDIT"
        )

        validate_balanced_entries(
            debit_total,
            credit_total,
        )

        return await capital_movement_entry_repository.create_entries(
            movement_id=request.movement_id,
            entries=entries,
        )


capital_movement_accounting_service = CapitalMovementAccountingService()
