from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class IntelligenceDecision:
    """
    Structured output of VFIA reasoning.

    This object represents an intelligence decision/request.
    It is NOT a broker order.
    """

    decision_id: str
    timestamp: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    instrument: str = ""
    action: str = "observe"

    thesis: str = ""
    confidence: float | None = None

    evidence: list[dict[str, Any]] = field(default_factory=list)
    risk_considerations: list[str] = field(default_factory=list)

    authorization_required: bool = True
    execution_allowed: bool = False

    metadata: dict[str, Any] = field(default_factory=dict)
