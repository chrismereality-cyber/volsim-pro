from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class FinancialWorldState:
    """
    Normalized representation of the financial environment observed
    by VFIA at a particular point in time.
    """

    timestamp: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    instruments: dict[str, Any] = field(default_factory=dict)
    market_conditions: dict[str, Any] = field(default_factory=dict)
    volatility: dict[str, Any] = field(default_factory=dict)
    liquidity: dict[str, Any] = field(default_factory=dict)
    portfolio_state: dict[str, Any] = field(default_factory=dict)
    risk_state: dict[str, Any] = field(default_factory=dict)
    external_context: dict[str, Any] = field(default_factory=dict)

    metadata: dict[str, Any] = field(default_factory=dict)
