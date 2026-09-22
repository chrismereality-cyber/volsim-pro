from decimal import Decimal

from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_movement_repository import (
    capital_movement_repository,
)
from src.treasury.capital_settlement_repository import (
    capital_settlement_repository,
)
from src.treasury.external_execution_adapter import (
    ExternalExecutionAdapter,
    ExternalExecutionResult,
    simulated_external_execution_adapter,
)


class CapitalExecutionOrchestrator:
    """
    Coordinates external execution evidence with treasury settlement.

    Flow:

        EXECUTING
            ↓
        PENDING settlement
            ↓
        external adapter execution
            ↓
        execution evidence validation
            ↓
        SETTLED

    The orchestrator does NOT:
    - mutate capital account balances directly
    - modify immutable vault state
    - execute MT5 trades
    - perform accounting-entry creation
    - bypass the settlement repository transaction
    """

    @staticmethod
    async def execute_and_settle(
        context: AuthorizationContext,
        movement_id: str,
        settlement_id: str,
        source_account_reference: str,
        destination_account_reference: str,
        adapter: ExternalExecutionAdapter | None = None,
    ):
        """
        Execute an external treasury movement and settle it using
        externally supplied execution evidence.

        The external adapter is responsible only for obtaining
        execution evidence.

        The settlement repository is responsible for the atomic:

            PENDING settlement → SETTLED
            EXECUTING movement → SETTLED
        """

        require_permission(
            context,
            "capital.execute",
        )

        movement_id = movement_id.strip()
        settlement_id = settlement_id.strip()
        source_account_reference = (
            source_account_reference.strip()
        )
        destination_account_reference = (
            destination_account_reference.strip()
        )

        if not movement_id:
            raise ValueError(
                "Capital movement id is required."
            )

        if not settlement_id:
            raise ValueError(
                "Capital settlement id is required."
            )

        if not source_account_reference:
            raise ValueError(
                "Source account reference is required."
            )

        if not destination_account_reference:
            raise ValueError(
                "Destination account reference is required."
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

        settlement = (
            await capital_settlement_repository.get_by_movement_id(
                movement_id
            )
        )

        if settlement is None:
            raise ValueError(
                "Capital settlement does not exist."
            )

        if str(settlement["id"]) != settlement_id:
            raise ValueError(
                "Settlement does not belong to the supplied settlement id."
            )

        if settlement["settlement_status"] != "PENDING":
            raise ValueError(
                "Capital settlement is not pending: "
                f"{settlement['settlement_status']}"
            )

        amount = Decimal(
            str(movement["amount"])
        )

        currency = str(
            movement["currency"]
        ).strip().upper()

        if adapter is None:
            adapter = (
                simulated_external_execution_adapter
            )

        evidence = await adapter.execute(
            movement_id=movement_id,
            movement_type=str(
                movement["movement_type"]
            ).strip(),
            amount=amount,
            currency=currency,
            source_account_reference=(
                source_account_reference
            ),
            destination_account_reference=(
                destination_account_reference
            ),
        )

        if not isinstance(
            evidence,
            ExternalExecutionResult,
        ):
            raise TypeError(
                "External execution adapter returned "
                "an invalid execution-evidence object."
            )

        external_reference = str(
            evidence.external_reference
        ).strip()

        if not external_reference:
            raise ValueError(
                "External execution reference is required."
            )

        evidence_amount = Decimal(
            str(evidence.amount)
        )

        if evidence_amount != amount:
            raise ValueError(
                "External execution amount does not "
                "match movement amount."
            )

        evidence_currency = str(
            evidence.currency
        ).strip().upper()

        if evidence_currency != currency:
            raise ValueError(
                "External execution currency does not "
                "match movement currency."
            )

        settled = (
            await capital_settlement_repository
            .settle_pending_settlement(
                settlement_id=settlement_id,
                external_reference=external_reference,
                tx_hash=(
                    evidence.tx_hash.strip()
                    if evidence.tx_hash
                    else None
                ),
                confirmation_count=(
                    evidence.confirmation_count
                ),
            )
        )

        return {
            "movement": settled[1],
            "settlement": settled[0],
            "execution_evidence": evidence,
        }


capital_execution_orchestrator = (
    CapitalExecutionOrchestrator()
)
