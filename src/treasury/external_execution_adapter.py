from dataclasses import dataclass
from decimal import Decimal
from uuid import uuid4


@dataclass(frozen=True)
class ExternalExecutionResult:
    """
    Evidence returned by an external execution provider.

    This represents execution evidence only.
    It does not itself modify VolSim-Pro balances.
    """

    external_reference: str
    amount: Decimal
    currency: str
    external_account_reference: str | None = None
    tx_hash: str | None = None
    confirmation_count: int = 0


class ExternalExecutionAdapter:
    """
    Abstract boundary for external treasury execution.

    Implementations may eventually connect to:
    - banking providers
    - payment providers
    - blockchain providers

    The adapter must never directly modify:
    - capital_accounts
    - immutable_vault_state
    - trading positions
    """

    async def execute(
        self,
        movement_id: str,
        movement_type: str,
        amount: Decimal,
        currency: str,
        source_account_reference: str,
        destination_account_reference: str,
    ) -> ExternalExecutionResult:
        raise NotImplementedError(
            "External execution adapter must implement execute()."
        )


class SimulatedExternalExecutionAdapter(
    ExternalExecutionAdapter
):
    """
    Safe non-live execution adapter.

    This adapter generates deterministic-shaped execution
    evidence without transferring real funds.
    """

    async def execute(
        self,
        movement_id: str,
        movement_type: str,
        amount: Decimal,
        currency: str,
        source_account_reference: str,
        destination_account_reference: str,
    ) -> ExternalExecutionResult:

        movement_id = movement_id.strip()
        movement_type = movement_type.strip()
        currency = currency.strip().upper()
        source_account_reference = (
            source_account_reference.strip()
        )
        destination_account_reference = (
            destination_account_reference.strip()
        )

        if not movement_id:
            raise ValueError(
                "Movement id is required."
            )

        if not movement_type:
            raise ValueError(
                "Movement type is required."
            )

        if amount <= Decimal("0"):
            raise ValueError(
                "Execution amount must be greater than zero."
            )

        if len(currency) != 3:
            raise ValueError(
                "Execution currency must be a 3-letter code."
            )

        if not source_account_reference:
            raise ValueError(
                "Source account reference is required."
            )

        if not destination_account_reference:
            raise ValueError(
                "Destination account reference is required."
            )

        external_reference = (
            f"SIM-EXEC-{uuid4().hex.upper()}"
        )

        return ExternalExecutionResult(
            external_reference=external_reference,
            amount=amount,
            currency=currency,
            external_account_reference=(
                destination_account_reference
            ),
            tx_hash=None,
            confirmation_count=0,
        )


simulated_external_execution_adapter = (
    SimulatedExternalExecutionAdapter()
)
