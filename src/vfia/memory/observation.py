from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class IntelligenceObservation:
    timestamp: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    source: str = ""
    subject: str = ""
    observation: str = ""
    observation_type: str = ""
    value: Any = None

    evidence: dict[str, Any] = field(default_factory=dict)
    metadata: dict[str, Any] = field(default_factory=dict)
    confidence: float | None = None

