import time
from typing import Any, Dict, Optional

from src.services.market_feature_service import (
    market_feature_service,
)


class MarketRegimeService:
    """
    Multi-instrument Market Regime Engine.

    Existing no-argument evaluate()/snapshot() calls remain
    compatible and default to XAUUSDm.
    """

    DEFAULT_SYMBOL = "XAUUSDm"

    ACTIVE_SYMBOLS = (
        "XAUUSDm",
        "BTCUSDm",
    )

    def __init__(self):

        self.states: Dict[str, Dict[str, Any]] = {
            symbol: self._empty_state(symbol)
            for symbol in self.ACTIVE_SYMBOLS
        }

        # Backward compatibility.
        self.state = self.states[
            self.DEFAULT_SYMBOL
        ]

    def _empty_state(
        self,
        symbol: str,
    ) -> Dict[str, Any]:

        return {
            "status": "ONLINE",
            "symbol": symbol,
            "regime": "WAITING",
            "volatility": "UNKNOWN",
            "trend_quality": 0.0,
            "execution_mode": "WAIT",
            "confidence": 0.0,
            "last_update": time.time(),
        }

    def _ensure_symbol(
        self,
        symbol: str,
    ) -> Dict[str, Any]:

        normalized = str(symbol).strip()

        if normalized not in self.states:
            self.states[normalized] = (
                self._empty_state(normalized)
            )

        return self.states[normalized]

    def evaluate(
        self,
        symbol: Optional[str] = None,
    ):

        symbol = (
            symbol
            or self.DEFAULT_SYMBOL
        )

        state = self._ensure_symbol(
            symbol
        )

        market_feature_service.evaluate(
            symbol
        )

        features = (
            market_feature_service.snapshot(
                symbol
            )
        )

        trend_strength = float(
            features.get(
                "trend_strength",
                0.0
            )
        )

        volatility_score = float(
            features.get(
                "volatility_score",
                0.0
            )
        )

        # Preserve the existing regime fields while
        # making their state independent per symbol.
        state.update({

            "status": "ONLINE",

            "symbol": symbol,

            "trend_quality":
                trend_strength,

            "confidence":
                volatility_score,

            "last_update":
                time.time(),

        })

        return state

    def snapshot(
        self,
        symbol: Optional[str] = None,
    ):

        symbol = (
            symbol
            or self.DEFAULT_SYMBOL
        )

        return self._ensure_symbol(
            symbol
        )

    def snapshot_all(self):

        return {
            symbol: dict(state)
            for symbol, state
            in self.states.items()
        }


market_regime_service = (
    MarketRegimeService()
)
