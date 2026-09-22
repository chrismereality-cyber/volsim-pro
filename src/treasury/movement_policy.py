from dataclasses import dataclass
from typing import Final


MOVEMENT_TYPES: Final[frozenset[str]] = frozenset({
    "EQUITY_TO_VAULT",
    "VAULT_TO_EQUITY",
    "EQUITY_TO_BANK",
    "VAULT_TO_BANK",
    "BANK_TO_EQUITY",
    "BANK_TO_VAULT",
})


@dataclass(frozen=True)
class MovementRule:
    source_type: str
    destination_type: str


MOVEMENT_RULES: Final[dict[str, MovementRule]] = {
    "EQUITY_TO_VAULT": MovementRule(
        source_type="TRADING_EQUITY",
        destination_type="IMMUTABLE_VAULT",
    ),
    "VAULT_TO_EQUITY": MovementRule(
        source_type="IMMUTABLE_VAULT",
        destination_type="TRADING_EQUITY",
    ),
    "EQUITY_TO_BANK": MovementRule(
        source_type="TRADING_EQUITY",
        destination_type="EXTERNAL_BANK",
    ),
    "VAULT_TO_BANK": MovementRule(
        source_type="IMMUTABLE_VAULT",
        destination_type="EXTERNAL_BANK",
    ),
    "BANK_TO_EQUITY": MovementRule(
        source_type="EXTERNAL_BANK",
        destination_type="TRADING_EQUITY",
    ),
    "BANK_TO_VAULT": MovementRule(
        source_type="EXTERNAL_BANK",
        destination_type="IMMUTABLE_VAULT",
    ),
}


def get_movement_rule(movement_type: str) -> MovementRule:
    try:
        return MOVEMENT_RULES[movement_type]
    except KeyError as exc:
        raise ValueError(
            f"Unsupported capital movement type: {movement_type}"
        ) from exc


def validate_account_types(
    movement_type: str,
    source_type: str,
    destination_type: str,
) -> None:
    rule = get_movement_rule(movement_type)

    if source_type != rule.source_type:
        raise ValueError(
            f"{movement_type} requires source account type "
            f"{rule.source_type}, got {source_type}."
        )

    if destination_type != rule.destination_type:
        raise ValueError(
            f"{movement_type} requires destination account type "
            f"{rule.destination_type}, got {destination_type}."
        )
