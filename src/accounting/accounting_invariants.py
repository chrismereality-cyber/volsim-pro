from decimal import Decimal


class AccountingInvariantError(ValueError):
    """Raised when a capital movement violates accounting invariants."""


def validate_positive_amount(amount: Decimal) -> None:
    if amount <= Decimal("0"):
        raise AccountingInvariantError(
            "Accounting amount must be greater than zero."
        )


def validate_currency(*currencies: str) -> None:
    normalized = {
        currency.strip().upper()
        for currency in currencies
    }

    if len(normalized) != 1:
        raise AccountingInvariantError(
            "All accounting entries in a movement must use the same currency."
        )


def validate_balanced_entries(
    debit_total: Decimal,
    credit_total: Decimal,
) -> None:
    if debit_total != credit_total:
        raise AccountingInvariantError(
            "Capital movement is not balanced: "
            f"debits={debit_total}, credits={credit_total}."
        )


def validate_distinct_accounts(
    source_account_id,
    destination_account_id,
) -> None:
    if source_account_id == destination_account_id:
        raise AccountingInvariantError(
            "Source and destination accounts must be different."
        )
