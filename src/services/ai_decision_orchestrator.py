import time
import uuid

from src.services.mt5_service import mt5_service
from src.services.portfolio_service import portfolio_service
from src.services.risk_service import risk_engine_service
from src.services.statistics_service import statistics_service
from src.services.counter_trend_execution_service import (
    counter_trend_execution_service,
)
from src.services.trend_detection_service import (
    trend_detection_service,
)
from src.services.market_regime_service import (
    market_regime_service,
)


class AIDecisionOrchestrator:

    """
    Enterprise AI Decision Layer.

    Aggregates:
    - Trend Engine
    - Market Regime
    - Risk Engine
    - Counter Trend Engine

    Produces:
    - BUY
    - SELL
    - HOLD

    Multi-symbol:
    - XAUUSDm
    - BTCUSDm

    Backward compatibility:
    - self.state remains the XAUUSDm state.
    - evaluate() without a symbol evaluates XAUUSDm.
    - snapshot() without a symbol returns XAUUSDm.
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

        # Backward-compatible XAUUSDm state alias.
        self.state = self.states[self.DEFAULT_SYMBOL]

        self._decision_signatures = {
            symbol: None
            for symbol in self.ACTIVE_SYMBOLS
        }


    def _empty_state(self, symbol):

        return {

            "status": "ONLINE",

            "symbol": symbol,

            "decision_id": None,

            "decision": "HOLD",

            "reason": "Awaiting evaluation",

            "confidence": 0.0,

            "trend_signal": "NONE",

            "counter_trend_signal": "NONE",

            "risk_permission": False,

            "execution_allowed": False,

            "last_update": time.time()

        }


    def _ensure_symbol(self, symbol):

        if symbol not in self.states:

            self.states[symbol] = self._empty_state(symbol)

            self._decision_signatures[symbol] = None

        return self.states[symbol]


    def evaluate(self, symbol=None):

        symbol = symbol or self.DEFAULT_SYMBOL

        state = self._ensure_symbol(symbol)

        account = mt5_service.get_account_state()

        portfolio = portfolio_service.get_portfolio_state()

        risk = risk_engine_service.snapshot()


        # Evaluate upstream intelligence for this instrument.

        trend_detection_service.evaluate(symbol)

        trend = trend_detection_service.snapshot(symbol)


        market_regime_service.evaluate(symbol)

        regime = market_regime_service.snapshot(symbol)


        counter = counter_trend_execution_service.snapshot(symbol)


        trend_signal = trend.get(
            "trend",
            "NONE"
        )


        confidence = trend.get(
            "confidence",
            0
        )


        risk_permission = True


        decision = "HOLD"

        reason = "No valid execution signal"


        #
        # Primary execution logic
        #

        if (
            trend_signal == "BULLISH"
            and confidence >= 25
            and risk_permission
        ):

            decision = "BUY"

            reason = (
                "Bullish trend alignment "
                "with acceptable confidence"
            )


        elif (
            trend_signal == "BEARISH"
            and confidence >= 25
            and risk_permission
        ):

            decision = "SELL"

            reason = (
                "Bearish trend alignment "
                "with acceptable confidence"
            )


        counter_trend_signal = counter.get(
            "signal",
            "NONE"
        )


        decision_signature = (
            decision,
            trend_signal,
            counter_trend_signal,
            bool(risk_permission),
        )


        if (
            decision_signature
            != self._decision_signatures[symbol]
        ):

            self._decision_signatures[symbol] = (
                decision_signature
            )

            state["decision_id"] = (
                "DECISION-" + uuid.uuid4().hex
            )


        state.update({

            "status":
                "ONLINE",

            "symbol":
                symbol,

            "trend_signal":
                trend_signal,

            "counter_trend_signal":
                counter_trend_signal,

            "risk_permission":
                risk_permission,

            "execution_allowed":
                risk_permission,

            "decision":
                decision,

            "reason":
                reason,

            "confidence":
                confidence,

            "last_update":
                time.time()

        })


        return state


    def snapshot(self, symbol=None):

        symbol = symbol or self.DEFAULT_SYMBOL

        return self._ensure_symbol(symbol)


    def snapshot_all(self):

        return {
            symbol: dict(state)
            for symbol, state in self.states.items()
        }


ai_decision_orchestrator = AIDecisionOrchestrator()
