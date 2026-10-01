import time


class AIExecutionService:
    """
    AI Execution Policy Layer.

    Converts AI decisions into controlled
    execution requests.

    Does NOT bypass:
    - Risk Engine
    - OMS
    - Execution Service

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


    def _empty_state(self, symbol):

        return {

            "status": "STANDBY",

            "symbol": symbol,

            "execution_signal": "NONE",

            "decision_id": None,

            "last_action": "WAITING",

            "last_order": None,

            "last_update": time.time()

        }


    def _ensure_symbol(self, symbol):

        if symbol not in self.states:

            self.states[symbol] = self._empty_state(symbol)

        return self.states[symbol]


    def evaluate(
        self,
        ai_decision,
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


        decision = ai_decision.get(
            "decision",
            "HOLD"
        )


        decision_id = ai_decision.get(
            "decision_id"
        )


        confidence = float(
            ai_decision.get(
                "confidence",
                0
            )
        )


        state["decision_id"] = decision_id

        state["execution_signal"] = decision

        state["symbol"] = symbol


        #
        # Execution confidence filter
        #

        if confidence < 70:

            state.update({

                "status":
                    "STANDBY",

                "last_action":
                    "CONFIDENCE_TOO_LOW",

                "last_update":
                    time.time()

            })

            return state


        if decision not in [
            "BUY",
            "SELL",
            "EXIT"
        ]:

            state.update({

                "status":
                    "STANDBY",

                "last_action":
                    "NO_DIRECTION",

                "last_update":
                    time.time()

            })

            return state


        state.update({

            "status":
                "READY",

            "last_action":
                "EXECUTION_READY",

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


ai_execution_service = AIExecutionService()
