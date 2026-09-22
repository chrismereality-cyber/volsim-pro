from __future__ import annotations

from typing import Any, Dict, List

from src.providers.base import MarketProvider
from src.providers.deriv_provider import deriv_provider
from src.providers.mt5_provider import mt5_provider


class ProviderRegistry:
    """
    Central registry for supported VolSim-Pro market providers.

    This registry describes provider availability. It does not execute
    orders and does not mutate trading state.
    """

    def __init__(self) -> None:
        self._providers: Dict[str, MarketProvider] = {
            "MT5": mt5_provider,
            "DERIV": deriv_provider,
        }

    def get(self, provider_id: str) -> MarketProvider | None:
        return self._providers.get(
            str(provider_id).upper().strip()
        )

    def list_providers(self) -> List[Dict[str, Any]]:
        result: List[Dict[str, Any]] = []

        for provider in self._providers.values():
            result.append(provider.status())

        return result

    def venue_snapshot(self) -> Dict[str, Any]:
        return {
            "venues": [
                {
                    "venue": "FOREX",
                    "provider": "MT5",
                    "status": mt5_provider.status(),
                    "instruments": mt5_provider.instruments(),
                },
                {
                    "venue": "DERIV_SYNTHETICS",
                    "provider": "DERIV",
                    "status": deriv_provider.status(),
                    "instruments": deriv_provider.instruments(),
                },
            ]
        }


provider_registry = ProviderRegistry()
