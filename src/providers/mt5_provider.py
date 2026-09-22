from __future__ import annotations

from typing import Any, Dict, List

from src.providers.base import MarketProvider
from src.services.mt5_service import mt5_service


class MT5Provider(MarketProvider):
    """
    MT5 market provider adapter.

    This adapter delegates to the existing authoritative MT5Service.
    It does not duplicate broker logic and does not execute orders.
    """

    provider_id = "MT5"
    venue_id = "FOREX"
    display_name = "MetaTrader 5"

    def status(self) -> Dict[str, Any]:
        try:
            connected = bool(mt5_service.connect())
        except Exception:
            connected = False

        return {
            "provider": self.provider_id,
            "venue": self.venue_id,
            "display_name": self.display_name,
            "status": "CONNECTED" if connected else "DISCONNECTED",
            "available": connected,
            "execution_supported": connected,
        }

    def instruments(self) -> List[Dict[str, Any]]:
        if not mt5_service.connect():
            return []

        registry = mt5_service.get_instrument_registry()

        result: List[Dict[str, Any]] = []

        for instrument in registry:
            if not isinstance(instrument, dict):
                continue

            result.append({
                **instrument,
                "provider": self.provider_id,
                "venue": self.venue_id,
            })

        return result

    def quote(self, symbol: str) -> Dict[str, Any]:
        context = mt5_service.get_symbol_execution_context(symbol)

        if not context:
            return {
                "provider": self.provider_id,
                "venue": self.venue_id,
                "symbol": symbol,
                "available": False,
                "status": "NO_QUOTE",
            }

        return {
            "provider": self.provider_id,
            "venue": self.venue_id,
            "symbol": symbol,
            "available": True,
            "status": "LIVE",
            "bid": context.get("bid", 0.0),
            "ask": context.get("ask", 0.0),
            "last": context.get("last", 0.0),
            "point": context.get("point", 0.0),
            "digits": context.get("digits", 0),
            "timestamp": context.get("timestamp", 0),
        }

    def contract(self, symbol: str) -> Dict[str, Any]:
        contract = mt5_service.get_symbol_contract(symbol)

        if not contract:
            return {
                "provider": self.provider_id,
                "venue": self.venue_id,
                "symbol": symbol,
                "available": False,
            }

        return {
            **contract,
            "provider": self.provider_id,
            "venue": self.venue_id,
            "available": True,
        }

    def execution_gate(self, symbol: str) -> Dict[str, Any]:
        result = mt5_service.get_symbol_market_gate(symbol)

        return {
            **result,
            "provider": self.provider_id,
            "venue": self.venue_id,
        }


mt5_provider = MT5Provider()
