from abc import ABC, abstractmethod
from typing import Any


class VFIAAgent(ABC):
    """
    Base interface for all VFIA intelligence agents.

    Agents reason about financial information but do not directly
    bypass VolSim-Pro governance or execution controls.
    """

    name: str = "unnamed_agent"
    version: str = "0.1.0"

    @abstractmethod
    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the agent's reasoning task.

        Implementations must return structured, auditable output.
        """
        raise NotImplementedError
