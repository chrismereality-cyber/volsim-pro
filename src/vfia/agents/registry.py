from .base import VFIAAgent


class AgentRegistry:
    """
    Registry for VFIA specialist agents.
    """

    def __init__(self) -> None:
        self._agents: dict[str, VFIAAgent] = {}

    def register(self, agent: VFIAAgent) -> None:
        if agent.name in self._agents:
            raise ValueError(f"Agent already registered: {agent.name}")

        self._agents[agent.name] = agent

    def get(self, name: str) -> VFIAAgent | None:
        return self._agents.get(name)

    def list_agents(self) -> list[str]:
        return sorted(self._agents.keys())
