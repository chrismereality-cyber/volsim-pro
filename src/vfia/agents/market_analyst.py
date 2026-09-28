from __future__ import annotations

from typing import Any

from src.vfia.agents.base import VFIAAgent
from src.vfia.core.world_state import FinancialWorldState
from src.vfia.memory.observation import IntelligenceObservation


class MarketAnalystAgent(VFIAAgent):
    """
    VFIA specialist responsible for descriptive market analysis.

    Responsibilities:
        - interpret current market observations
        - identify observable market conditions
        - summarize regime/trend/volatility information
        - identify analytical signals for higher-level reasoning

    This agent does NOT:
        - place orders
        - authorize execution
        - modify portfolio state
        - bypass risk governance
        - directly control broker execution
    """

    name = "market_analyst"
    version = "0.1.0"

    async def run(
        self,
        context: dict[str, Any],
    ) -> dict[str, Any]:

        world_state = context.get("world_state")

        if not isinstance(
            world_state,
            FinancialWorldState,
        ):
            raise TypeError(
                "MarketAnalystAgent requires "
                "FinancialWorldState in context['world_state']"
            )

        observations = context.get(
            "observations",
            [],
        )

        market_conditions = (
            world_state.market_conditions
            or {}
        )

        volatility = (
            world_state.volatility
            or {}
        )

        instruments = (
            world_state.instruments
            or {}
        )

        analysis = {
            "agent": self.name,
            "version": self.version,
            "analysis_type": "market",
            "instrument_count": len(instruments),
            "instruments": list(
                instruments.keys()
            ),
            "market_conditions": market_conditions,
            "volatility": volatility,
            "observation_count": len(
                observations
            ),
            "execution_authorized": False,
            "execution_allowed": False,
        }

        return analysis


market_analyst_agent = MarketAnalystAgent()
