import time
from typing import Any, Dict, Optional

import MetaTrader5 as mt5


class MarketFeatureService:
    """
    Enterprise Market Feature Engine.

    Multi-instrument feature state for the active VolSim-Pro
    execution universe.

    Provides:
    - ATR
    - EMA
    - RSI
    - Volatility
    - Trend strength

    The default symbol remains XAUUSDm so existing callers using
    evaluate() / snapshot() remain compatible.
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

        # Backward-compatible reference for existing code that
        # expects .state to exist.
        self.state = self.states[self.DEFAULT_SYMBOL]

    def _empty_state(
        self,
        symbol: str,
    ) -> Dict[str, Any]:

        return {
            "status": "ONLINE",

            "symbol": symbol,

            "price": 0.0,

            "spread": 0.0,

            "atr": 0.0,

            "adx": 0.0,

            "ema20": 0.0,

            "ema50": 0.0,

            "ema200": 0.0,

            "sma200": 0.0,

            "rsi": 0.0,

            "volume": 0.0,

            "trend_strength": 0.0,

            "volatility_score": 0.0,

            "market_structure": "WAITING",

            "session": "UNKNOWN",

            "liquidity": "UNKNOWN",

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

        state = self._ensure_symbol(symbol)

        rates = mt5.copy_rates_from_pos(
            symbol,
            mt5.TIMEFRAME_M5,
            0,
            200,
        )

        if rates is None or len(rates) < 200:

            state.update({
                "status": "WAITING_FOR_DATA",
                "last_update": time.time(),
            })

            return state

        closes = [
            candle["close"]
            for candle in rates
        ]

        highs = [
            candle["high"]
            for candle in rates
        ]

        lows = [
            candle["low"]
            for candle in rates
        ]

        price = closes[-1]

        # Responsive trend layer:
        # genuine exponential moving averages.
        def calculate_ema(
            values,
            period,
        ):
            if not values:
                return 0.0

            alpha = 2.0 / (period + 1)

            ema = float(values[0])

            for value in values[1:]:
                ema = (
                    alpha * float(value)
                    + (1.0 - alpha) * ema
                )

            return ema

        ema20 = calculate_ema(
            closes,
            20,
        )

        ema50 = calculate_ema(
            closes,
            50,
        )

        # Slow confirmation layer:
        # simple moving average of the full 200-bar window.
        sma200 = (
            sum(closes[-200:])
            / 200
        )

        # Compatibility field retained because existing
        # consumers expect "ema200". It now represents
        # the intended slow SMA200 confirmation level.
        ema200 = sma200

        atr_values = []

        for i in range(1, len(closes)):

            tr = max(
                highs[i] - lows[i],
                abs(
                    highs[i] - closes[i - 1]
                ),
                abs(
                    lows[i] - closes[i - 1]
                ),
            )

            atr_values.append(tr)

        atr = (
            sum(atr_values[-14:]) / 14
            if len(atr_values) >= 14
            else 0.0
        )

        gains = []
        losses = []

        for i in range(1, len(closes)):

            diff = (
                closes[i]
                - closes[i - 1]
            )

            if diff >= 0:

                gains.append(diff)
                losses.append(0)

            else:

                gains.append(0)
                losses.append(abs(diff))

        avg_gain = (
            sum(gains[-14:]) / 14
            if len(gains) >= 14
            else 0.0
        )

        avg_loss = (
            sum(losses[-14:]) / 14
            if len(losses) >= 14
            else 0.0
        )

        if avg_loss == 0:

            rsi = 100.0

        else:

            rs = (
                avg_gain / avg_loss
            )

            rsi = (
                100
                - (
                    100
                    / (1 + rs)
                )
            )

        volatility = (
            atr / price * 100
            if price
            else 0.0
        )

        # Trend strength measures separation inside the
        # responsive EMA trend layer.
        trend_strength = (
            abs(
                ema20 - ema50
            )
            / price
            * 100
            if price
            else 0.0
        )

        tick = mt5.symbol_info_tick(
            symbol
        )

        spread = 0.0

        if tick is not None:

            spread = (
                float(tick.ask)
                - float(tick.bid)
            )

        state.update({

            "status": "ONLINE",

            "price": price,

            "spread": spread,

            "atr": atr,

            "ema20": ema20,

            "ema50": ema50,

            "ema200": ema200,

            "sma200": sma200,

            "rsi": rsi,

            "trend_strength":
                trend_strength,

            "volatility_score":
                volatility,

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


market_feature_service = (
    MarketFeatureService()
)
