from dataclasses import dataclass
from decimal import Decimal
from typing import Final

from src.accounting.accounting_invariants import (
    validate_currency,
)
from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_account_repository import (
    capital_account_repository,
)


CANONICAL_ACCOUNT_DEFINITIONS: Final[dict[str, str]] = {
    "TRADING-EQUITY": "TRADING_EQUITY",
    "IMMUTABLE-VAULT": "IMMUTABLE_VAULT",
    "EXTERNAL-BANK": "EXTERNAL_BANK",
}


@dataclass(frozen=True)
class CapitalAccountBootstrap:
    account_code: str
    account_type: str
    currency: str
    opening_balance: Decimal
    reason: str


class CapitalAccountService:
    """
    Domain service for canonical Treasury capital accounts.

    Account creation and opening-balance initialization remain explicit
    bootstrap operations.

    No existing trading, vault, or wallet balance is imported
    automatically.
    """

    @staticmethod
    def validate_bootstrap(
        bootstrap: CapitalAccountBootstrap,
        context: AuthorizationContext,
    ) -> None:
        require_permission(context, "capital.manage")

        expected_type = CANONICAL_ACCOUNT_DEFINITIONS.get(
            bootstrap.account_code
        )

        if expected_type is None:
            raise ValueError(
                f"Unsupported canonical account code: "
                f"{bootstrap.account_code}"
            )

        if bootstrap.account_type != expected_type:
            raise ValueError(
                f"{bootstrap.account_code} requires account type "
                f"{expected_type}, got {bootstrap.account_type}."
            )

        validate_currency(bootstrap.currency)

        if bootstrap.opening_balance < Decimal("0"):
            raise ValueError(
                "Opening balance cannot be negative."
            )

        if not bootstrap.reason.strip():
            raise ValueError(
                "Opening balance reason is required."
            )

    @staticmethod
    async def account_exists(
        account_code: str,
    ) -> bool:
        return await capital_account_repository.account_exists(
            account_code
        )

    @staticmethod
    async def bootstrap_accounts(
        bootstraps: list[CapitalAccountBootstrap],
        context: AuthorizationContext,
    ):
        """
        Atomically bootstrap the supplied canonical Treasury accounts.

        All accounts are validated before persistence.

        The database transaction creates every account together.
        If one creation fails, the complete batch rolls back.

        Opening balances are explicit inputs. Nothing is imported from
        existing trading or immutable-vault state.
        """

        if not bootstraps:
            raise ValueError(
                "At least one capital account bootstrap is required."
            )

        require_permission(context, "capital.manage")

        seen_codes: set[str] = set()

        for bootstrap in bootstraps:
            if bootstrap.account_code in seen_codes:
                raise ValueError(
                    f"Duplicate account in bootstrap request: "
                    f"{bootstrap.account_code}"
                )

            seen_codes.add(bootstrap.account_code)

            CapitalAccountService.validate_bootstrap(
                bootstrap,
                context,
            )

        existing_codes = []

        for bootstrap in bootstraps:
            existing = await capital_account_repository.get_by_code(
                bootstrap.account_code,
            )

            if existing is not None:
                existing_codes.append(
                    bootstrap.account_code
                )

        if existing_codes:
            raise ValueError(
                "Capital account(s) already exist: "
                + ", ".join(sorted(existing_codes))
            )

        return await capital_account_repository.create_accounts(
            [
                {
                    "account_code": bootstrap.account_code,
                    "account_type": bootstrap.account_type,
                    "currency": bootstrap.currency,
                    "opening_balance": bootstrap.opening_balance,
                }
                for bootstrap in bootstraps
            ]
        )


capital_account_service = CapitalAccountService()
