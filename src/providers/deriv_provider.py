from __future__ import annotations

from typing import Any, Dict, List

from src.providers.base import MarketProvider


class DerivProvider(MarketProvider):
    """
    Deriv synthetic-market provider boundary.

    The provider is deliberately fail-closed until a real Deriv
    connection/feed/execution adapter is implemented.

    No synthetic prices are generated here.
    No TradingView proxy symbols are used.
    No MT5 symbols are masqueraded as Deriv instruments.
    """

    provider_id = "DERIV"
    venue_id = "DERIV_SYNTHETICS"
    display_name = "Deriv"

    def status(self) -> Dict[str, Any]:
        return {
            "provider": self.provider_id,
            "venue": self.venue_id,
            "display_name": self.display_name,
            "status": "NOT_CONFIGURED",
            "available": False,
            "execution_supported": False,
            "reason": "Deriv provider adapter is not configured.",
        }

    def instruments(self) -> List[Dict[str, Any]]:
        return []

    def quote(self, symbol: str) -> Dict[str, Any]:
        return {
            "provider": self.provider_id,
            "venue": self.venue_id,
            "symbol": symbol,
            "available": False,
            "status": "PROVIDER_NOT_CONFIGURED",
            "reason": "No authoritative Deriv market feed is connected.",
        }

    def contract(self, symbol: str) -> Dict[str, Any]:
        return {
            "provider": self.provider_id,
            "venue": self.venue_id,
            "symbol": symbol,
            "available": False,
            "status": "PROVIDER_NOT_CONFIGURED",
        }

    def execution_gate(self, symbol: str) -> Dict[str, Any]:
        return {
            "provider": self.provider_id,
            "venue": self.venue_id,
            "symbol": symbol,
            "allowed": False,
            "status": "PROVIDER_NOT_CONFIGURED",
            "reason": "Deriv execution adapter is not configured.",
        }


deriv_provider = DerivProvider()
