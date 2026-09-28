import time


class CounterTrendExecutionService:
    """
    Institutional Counter Trend Overlay Engine.

    Generates temporary protective
    counter-position signals.

    Does NOT execute orders.
    Execution Engine consumes this state.

    Multi-symbol:
        XAUUSDm
        BTCUSDm

    Backward compatibility:
        self.state remains the XAUUSDm state.
        evaluate() and snapshot() without a symbol
        continue to operate on XAUUSDm.
    """

    DEFAULT_SYMBOL = "XAUUSDm"
    ACTIVE_SYMBOLS = (
        "XAUUSDm",
        "BTCUSDm",
    )

    def __init__(self):

        self.states = {
            symbol: self._empty_state(symbol)
            for symbol in self.ACTIVE_SYMBOLS
        }

        # Backward-compatible XAUUSDm state alias
        self.state = self.states[self.DEFAULT_SYMBOL]


    def _empty_state(self, symbol):

        return {

            "status": "ACTIVE",

            "symbol": symbol,

            "enabled": True,

            "signal": "NONE",

            "confidence": 0.0,

            "reason": "Waiting",

            "direction": None,

            "overlay_position_size": 0.0,

            "trigger": {},

            "last_update": time.time()

        }


    def _ensure_symbol(self, symbol):

        if symbol not in self.states:
            self.states[symbol] = self._empty_state(symbol)

        return self.states[symbol]


    def snapshot(self, symbol=None):

        symbol = symbol or self.DEFAULT_SYMBOL

        return self._ensure_symbol(symbol)


    def snapshot_all(self):

        return {
            symbol: dict(state)
            for symbol, state in self.states.items()
        }


    def evaluate(
        self,
        market_state,
        portfolio_state,
        risk_state,
        symbol=None
    ):

        symbol = (
            symbol
            or market_state.get("symbol")
            or self.DEFAULT_SYMBOL
        )

        state = self._ensure_symbol(symbol)

        trend = (
            market_state
            .get("trend", "NONE")
        )

        rsi = float(
            market_state.get("rsi", 0)
        )

        atr = float(
            market_state.get("atr", 0)
        )

        drawdown = float(
            risk_state.get(
                "drawdown",
                0
            )
        )

        state["trigger"] = {

            "trend": trend,

            "rsi": rsi,

            "atr": atr,

            "drawdown": drawdown

        }


        signal = "NONE"

        direction = None

        confidence = 0

        reason = "No counter trend condition"


        # Bullish exhaustion protection

        if trend == "BULLISH":

            if (
                rsi >= 70
                or drawdown >= 1.0
            ):

                signal = "SELL"

                direction = "BEARISH"

                confidence = 75

                reason = (
                    "Bullish exhaustion "
                    "counter trend overlay"
                )


        # Bearish exhaustion protection

        elif trend == "BEARISH":

            if (
                rsi <= 30
                or drawdown >= 1.0
            ):

                signal = "BUY"

                direction = "BULLISH"

                confidence = 75

                reason = (
                    "Bearish exhaustion "
                    "counter trend overlay"
                )


        state.update({

            "status": "ACTIVE",

            "symbol": symbol,

            "signal": signal,

            "confidence": confidence,

            "reason": reason,

            "direction": direction,

            "overlay_position_size": (
                0.25
                if signal != "NONE"
                else 0.0
            ),

            "last_update": time.time()

        })


        return state


counter_trend_execution_service = (
    CounterTrendExecutionService()
)
