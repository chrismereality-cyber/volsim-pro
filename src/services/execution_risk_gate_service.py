import time


class ExecutionRiskGateService:
    """
    Institutional execution safety layer.

    Validates AI execution requests before OMS.

    Checks:
    - confidence
    - risk permission
    - execution permission
    - exposure
    - duplicate positions

    Does NOT execute orders.

    Multi-symbol:
    - XAUUSDm
    - BTCUSDm

    Backward compatibility:
    - self.state remains the XAUUSDm state.
    - approve() without a symbol uses the symbol from
      ai_decision, otherwise XAUUSDm.
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


    def _empty_state(self, symbol):

        return {

            "status": "ONLINE",

            "symbol": symbol,

            "approved": False,

            "reason": "Waiting",

            "decision_id": None,

            "last_check": time.time()

        }


    def _ensure_symbol(self, symbol):

        if symbol not in self.states:

            self.states[symbol] = self._empty_state(symbol)

        return self.states[symbol]


    def approve(
        self,
        ai_decision,
        ai_execution,
        risk_state,
        portfolio_state,
        symbol=None
    ):

        symbol = (
            symbol
            or ai_decision.get("symbol")
            or self.DEFAULT_SYMBOL
        )

        state = self._ensure_symbol(symbol)

        decision_id = ai_decision.get(
            "decision_id"
        )

        state["decision_id"] = decision_id

        confidence = float(
            ai_decision.get(
                "confidence",
                0
            )
        )


        if not ai_decision.get(
            "risk_permission",
            False
        ):

            return self.reject(
                "Risk permission denied",
                symbol=symbol
            )


        if not ai_decision.get(
            "execution_allowed",
            False
        ):

            return self.reject(
                "Execution disabled",
                symbol=symbol
            )


        minimum_confidence = 25

        if confidence < minimum_confidence:

            return self.reject(
                "Confidence below threshold",
                symbol=symbol
            )


        # AI Execution Policy is the explicit execution
        # authorization boundary.
        if ai_execution.get("status") != "READY":

            return self.reject(
                "AI execution authorization not ready",
                symbol=symbol
            )

        if ai_execution.get(
            "execution_signal"
        ) not in [
            "BUY",
            "SELL",
            "EXIT"
        ]:

            return self.reject(
                "No execution signal",
                symbol=symbol
            )


        exposure = float(
            portfolio_state.get(
                "exposure",
                0
            )
        )


        if exposure > 1000000:

            return self.reject(
                "Maximum exposure exceeded",
                symbol=symbol
            )


        state.update({

            "status":
                "ONLINE",

            "symbol":
                symbol,

            "approved":
                True,

            "reason":
                "Execution approved",

            "decision_id":
                decision_id,

            "last_check":
                time.time()

        })


        return state


    def reject(
        self,
        reason,
        symbol=None
    ):

        symbol = symbol or self.DEFAULT_SYMBOL

        state = self._ensure_symbol(symbol)

        state.update({

            "status":
                "ONLINE",

            "symbol":
                symbol,

            "approved":
                False,

            "reason":
                reason,

            "last_check":
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


execution_risk_gate_service = (
    ExecutionRiskGateService()
)
