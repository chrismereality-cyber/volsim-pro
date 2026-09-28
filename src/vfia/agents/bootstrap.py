from __future__ import annotations

from src.vfia.agents.market_analyst import (
    market_analyst_agent,
)
from src.vfia.agents.registry import AgentRegistry


def build_default_registry() -> AgentRegistry:
    """
    Build the default VFIA specialist-agent registry.

    Registration only.
    No trading execution occurs here.
    """

    registry = AgentRegistry()

    registry.register(
        market_analyst_agent
    )

    return registry
