from dataclasses import dataclass, field
from typing import FrozenSet


@dataclass(frozen=True)
class Identity:
    """Authenticated principal used throughout VolSim-Pro."""

    user_id: str
    username: str | None = None
    roles: FrozenSet[str] = field(default_factory=frozenset)
    permissions: FrozenSet[str] = field(default_factory=frozenset)
    is_active: bool = True


@dataclass(frozen=True)
class AuthorizationContext:
    """Authorization context passed into protected operations."""

    identity: Identity
    request_id: str | None = None
    source: str | None = None
