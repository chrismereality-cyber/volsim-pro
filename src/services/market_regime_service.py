import time
from typing import Any, Dict, Optional

from src.services.mt5_service import mt5_service

from src.services.market_feature_service import (
    market_feature_service,
)
from src.services.trend_detection_service import (
    trend_detection_service,
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

        # Use the authoritative MT5 connection path before
        # requesting market features.
        if not mt5_service.connect():
            state.update({
                "status": "MT5_UNAVAILABLE",
                "symbol": symbol,
                "regime": "WAITING",
                "volatility": "UNKNOWN",
                "execution_mode": "WAIT",
                "confidence": 0.0,
                "last_update": time.time(),
            })
            return state

        market_feature_service.evaluate(
            symbol
        )

        features = (
            market_feature_service.snapshot(
                symbol
            )
        )

        trend_detection_service.evaluate(
            symbol
        )

        trend = (
            trend_detection_service.snapshot(
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

        market_phase = str(
            trend.get(
                "market_phase",
                "WAITING"
            )
        )

        trend_signal = str(
            trend.get(
                "trend",
                "NONE"
            )
        )

        if market_phase == "TRENDING_UP":
            regime = "TRENDING_UP"

        elif market_phase == "TRENDING_DOWN":
            regime = "TRENDING_DOWN"

        elif market_phase == "RANGE":
            regime = "RANGING"

        else:
            regime = "TRANSITION"

        if volatility_score < 0.05:
            volatility = "LOW"

        elif volatility_score < 0.15:
            volatility = "NORMAL"

        else:
            volatility = "HIGH"

        if regime in (
            "TRENDING_UP",
            "TRENDING_DOWN",
        ):
            execution_mode = "TREND"

        elif regime == "RANGING":
            execution_mode = "RANGE"

        else:
            execution_mode = "WAIT"

        # Regime is descriptive only.
        # It does not authorize, reject, or size trades.
        state.update({

            "status": "ONLINE",

            "symbol": symbol,

            "regime": regime,

            "volatility": volatility,

            "trend_quality":
                trend_strength,

            "execution_mode":
                execution_mode,

            "confidence":
                float(
                    trend.get(
                        "confidence",
                        0.0
                    )
                ),

            "trend":
                trend_signal,

            "market_phase":
                market_phase,

            "volatility_score":
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


