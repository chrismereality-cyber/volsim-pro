from __future__ import annotations

from typing import Any

from src.vfia.agents.registry import AgentRegistry
from src.vfia.agents.bootstrap import build_default_registry
from src.vfia.memory.observation_pipeline import (
    VFIAObservationPipeline,
)

from src.vfia.core.world_state import (
    FinancialWorldState,
)


class IntelligenceOrchestrator:
    """
    Central coordination layer for VFIA specialist intelligence.

    The orchestrator coordinates observation and analysis.

    It does NOT:
        - place broker orders
        - bypass risk controls
        - mutate trading state
        - directly control execution
    """

    version = "0.1.0"

    def __init__(
        self,
        registry: AgentRegistry | None = None,
        observation_pipeline: (
            VFIAObservationPipeline | None
        ) = None,
    ) -> None:

        self.registry = (
            registry
            if registry is not None
            else build_default_registry()
        )

        self.observation_pipeline = (
            observation_pipeline
            if observation_pipeline is not None
            else VFIAObservationPipeline()
        )

    def observe(
        self,
        world_state: FinancialWorldState,
    ) -> list[Any]:
        """
        Produce structured observations from world state.
        """

        return self.observation_pipeline.observe(
            world_state
        )

    async def reason(
        self,
        world_state: FinancialWorldState,
    ) -> dict[str, Any]:
        """
        Run registered specialist agents against
        the supplied world state.

        This method is analytical only.
        """

        observations = self.observe(
            world_state
        )

        results: dict[str, Any] = {}

        for agent in self.registry.list_agents():

            specialist = self.registry.get(
                agent
            )

            if specialist is None:
                continue

            results[agent] = await specialist.run(
                {
                    "world_state": world_state,
                    "observations": observations,
                }
            )

        return results

    async def analyze(
        self,
        world_state: FinancialWorldState,
    ) -> dict[str, Any]:
        """
        Produce a complete VFIA intelligence assessment.

        This is the main specialist-analysis entry point.
        """

        observations = self.observe(
            world_state
        )

        specialist_results: dict[
            str,
            Any,
        ] = {}

        for agent_name in self.registry.list_agents():

            agent = self.registry.get(
                agent_name
            )

            if agent is None:
                continue

            specialist_results[
                agent_name
            ] = await agent.run(
                {
                    "world_state": world_state,
                    "observations": observations,
                }
            )

        return {
            "vfia_version": self.version,
            "analysis_type": "financial_intelligence",
            "timestamp": world_state.timestamp,
            "observation_count": len(
                observations
            ),
            "registered_agents": self.registry.list_agents(),
            "specialist_results": specialist_results,
            "execution_authorized": False,
            "execution_allowed": False,
        }


intelligence_orchestrator = IntelligenceOrchestrator()

