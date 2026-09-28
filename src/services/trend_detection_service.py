import time
from typing import Any, Dict, Optional

from src.services.market_feature_service import (
    market_feature_service,
)


class TrendDetectionService:
    """
    Enterprise Trend Detection Engine.

    Multi-instrument trend analysis built on the shared
    MarketFeatureService.

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

        # Backward compatibility for existing callers.
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

            "trend": "NONE",

            "confidence": 0.0,

            "strength": 0.0,

            "market_phase": "WAITING",

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

        ema20 = features.get(
            "ema20",
            0
        )

        ema50 = features.get(
            "ema50",
            0
        )

        ema200 = features.get(
            "ema200",
            0
        )

        rsi = features.get(
            "rsi",
            50
        )

        trend_strength = features.get(
            "trend_strength",
            0
        )

        volatility = features.get(
            "volatility_score",
            0
        )

        trend = "NONE"

        market_phase = "WAITING"

        # Bullish structure
        if (
            ema20 > ema50
            and ema50 > ema200
        ):

            trend = "BULLISH"

            market_phase = "TRENDING_UP"

        # Bearish structure
        elif (
            ema20 < ema50
            and ema50 < ema200
        ):

            trend = "BEARISH"

            market_phase = "TRENDING_DOWN"

        # Range condition
        else:

            trend = "SIDEWAYS"

            market_phase = "RANGE"

        #
        # Existing confidence model preserved.
        #

        momentum_score = 0

        if trend == "BULLISH":

            momentum_score = min(
                max(
                    (rsi - 50) * 2,
                    0
                ),
                100
            )

        elif trend == "BEARISH":

            momentum_score = min(
                max(
                    (50 - rsi) * 2,
                    0
                ),
                100
            )

        strength_score = min(
            abs(trend_strength) * 20,
            100
        )

        volatility_score = min(
            volatility * 100,
            100
        )

        confidence = round(
            (
                momentum_score * 0.4
                +
                strength_score * 0.4
                +
                volatility_score * 0.2
            ),
            2
        )

        state.update({

            "status": "ONLINE",

            "symbol": symbol,

            "trend": trend,

            "confidence": confidence,

            "strength": trend_strength,

            "market_phase": market_phase,

            "last_update": time.time(),

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


trend_detection_service = (
    TrendDetectionService()
)
