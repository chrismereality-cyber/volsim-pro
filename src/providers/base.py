from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List


class MarketProvider(ABC):
    """
    Common market-provider contract.

    A provider exposes venue/instrument information and market state.
    Execution remains owned by the execution infrastructure.
    """

    provider_id: str
    venue_id: str
    display_name: str

    @abstractmethod
    def status(self) -> Dict[str, Any]:
        """Return provider connectivity and capability status."""
        raise NotImplementedError

    @abstractmethod
    def instruments(self) -> List[Dict[str, Any]]:
        """Return instruments currently exposed by the provider."""
        raise NotImplementedError

    @abstractmethod
    def quote(self, symbol: str) -> Dict[str, Any]:
        """Return the provider's authoritative quote for a symbol."""
        raise NotImplementedError

    @abstractmethod
    def contract(self, symbol: str) -> Dict[str, Any]:
        """Return execution/contract metadata for a symbol."""
        raise NotImplementedError

    @abstractmethod
    def execution_gate(self, symbol: str) -> Dict[str, Any]:
        """
        Return whether the provider currently permits execution
        for the specified symbol.

        This is informational/gating state only.
        It does not execute an order.
        """
        raise NotImplementedError
