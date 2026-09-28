from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.vfia.core.world_state import FinancialWorldState
from src.vfia.memory.observation import IntelligenceObservation


class VFIAObservationPipeline:
    """
    Converts a FinancialWorldState into structured observations.

    This layer is intentionally descriptive rather than prescriptive.

    It may identify:
        - market conditions
        - regime information
        - trend information
        - volatility information
        - liquidity information
        - portfolio conditions
        - risk conditions
        - existing AI intelligence

    It must NOT:
        - place orders
        - authorize execution
        - mutate trading state
        - bypass risk governance
        - make broker decisions
    """

    version = "0.1.0"

    def observe(
        self,
        world_state: FinancialWorldState,
    ) -> list[IntelligenceObservation]:
        observations: list[IntelligenceObservation] = []

        self._observe_instruments(
            world_state,
            observations,
        )

        self._observe_market(
            world_state,
            observations,
        )

        self._observe_portfolio(
            world_state,
            observations,
        )

        self._observe_risk(
            world_state,
            observations,
        )

        self._observe_existing_ai(
            world_state,
            observations,
        )

        return observations

    def _observe_instruments(
        self,
        world_state: FinancialWorldState,
        observations: list[IntelligenceObservation],
    ) -> None:

        for symbol, instrument in world_state.instruments.items():

            observations.append(
                IntelligenceObservation(
                    observation_type="instrument_state",
                    subject=symbol,
                    value=instrument,
                    timestamp=_observation_time(
                        instrument.get("timestamp")
                    ),
                    source="VFIAWorldStateAdapter",
                    confidence=1.0,
                    metadata={
                        "observation_layer": "market",
                        "vfia_version": self.version,
                    },
                )
            )

    def _observe_market(
        self,
        world_state: FinancialWorldState,
        observations: list[IntelligenceObservation],
    ) -> None:

        conditions = world_state.market_conditions

        if not conditions:
            return

        observations.append(
            IntelligenceObservation(
                observation_type="market_conditions",
                subject="global_market_state",
                value=conditions,
                timestamp=world_state.timestamp,
                source="VFIAWorldStateAdapter",
                confidence=1.0,
                metadata={
                    "observation_layer": "market",
                    "vfia_version": self.version,
                },
            )
        )

        volatility = world_state.volatility

        if volatility:
            observations.append(
                IntelligenceObservation(
                    observation_type="volatility_state",
                    subject="global_market_state",
                    value=volatility,
                    timestamp=world_state.timestamp,
                    source="VFIAWorldStateAdapter",
                    confidence=1.0,
                    metadata={
                        "observation_layer": "volatility",
                        "vfia_version": self.version,
                    },
                )
            )

    def _observe_portfolio(
        self,
        world_state: FinancialWorldState,
        observations: list[IntelligenceObservation],
    ) -> None:

        portfolio = world_state.portfolio_state

        if not portfolio:
            return

        observations.append(
            IntelligenceObservation(
                observation_type="portfolio_state",
                subject="portfolio",
                value=portfolio,
                timestamp=world_state.timestamp,
                source="VFIAWorldStateAdapter",
                confidence=1.0,
                metadata={
                    "observation_layer": "portfolio",
                    "vfia_version": self.version,
                },
            )
        )

    def _observe_risk(
        self,
        world_state: FinancialWorldState,
        observations: list[IntelligenceObservation],
    ) -> None:

        risk = world_state.risk_state

        if not risk:
            return

        observations.append(
            IntelligenceObservation(
                observation_type="risk_state",
                subject="portfolio_risk",
                value=risk,
                timestamp=world_state.timestamp,
                source="VFIAWorldStateAdapter",
                confidence=1.0,
                metadata={
                    "observation_layer": "risk",
                    "vfia_version": self.version,
                },
            )
        )

    def _observe_existing_ai(
        self,
        world_state: FinancialWorldState,
        observations: list[IntelligenceObservation],
    ) -> None:

        context = world_state.external_context

        if not context:
            return

        existing_ai = {
            key: context.get(key)
            for key in (
                "ai_decision",
                "ai_execution",
                "ai_execution_orchestrator",
            )
            if context.get(key) is not None
        }

        if not existing_ai:
            return

        observations.append(
            IntelligenceObservation(
                observation_type="existing_ai_state",
                subject="volsim_ai",
                value=existing_ai,
                timestamp=world_state.timestamp,
                source="VolSim-Pro",
                confidence=1.0,
                metadata={
                    "observation_layer": "existing_ai",
                    "vfia_version": self.version,
                },
            )
        )


def _observation_time(
    value: Any,
) -> datetime:

    if isinstance(value, datetime):
        return value

    if value is None:
        return datetime.now(timezone.utc)

    try:
        return datetime.fromtimestamp(
            float(value),
            tz=timezone.utc,
        )
    except (TypeError, ValueError, OverflowError):
        return datetime.now(timezone.utc)


vfia_observation_pipeline = VFIAObservationPipeline()
