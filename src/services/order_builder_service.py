import time
import logging


from src.services.mt5_service import mt5_service


logger = logging.getLogger("volsim.order_builder")


class OrderBuilderService:
    """
    Institutional Order Construction Layer.

    Converts approved AI execution decisions into OMS-compatible
    order requests.

    Responsibilities:
    - validate execution approval
    - validate BUY/SELL decision
    - obtain live broker execution price
    - normalize price to broker precision
    - preserve explicitly supplied protective exits
    - construct normalized OMS order request
    - expose symbol-scoped builder state

    Does NOT:
    - calculate risk
    - bypass risk
    - execute trades
    - manage positions
    - determine trading strategy
    - invent stop-loss or take-profit levels
    """

    DEFAULT_SYMBOL = "XAUUSDm"
    ACTIVE_SYMBOLS = (
        "XAUUSDm",
        "BTCUSDm",
    )

    DEFAULT_VOLUME = 0.01
    MAGIC_NUMBER = 202607

    def __init__(self):

        self.states = {
            symbol: self._empty_state(symbol)
            for symbol in self.ACTIVE_SYMBOLS
        }

        # Backward-compatible XAUUSDm alias.
        self.state = self.states[self.DEFAULT_SYMBOL]

    # ------------------------------------------------------------------
    # State helpers
    # ------------------------------------------------------------------

    def _empty_state(self, symbol):

        return {
            "status": "STANDBY",
            "symbol": symbol,
            "order_ready": False,
            "order_request": None,
            "last_update": time.time(),
        }

    def _ensure_symbol(self, symbol):

        if not symbol:
            symbol = self.DEFAULT_SYMBOL

        if symbol not in self.states:
            self.states[symbol] = self._empty_state(symbol)

        return symbol

    def _state(self, symbol):

        symbol = self._ensure_symbol(symbol)

        return self.states[symbol]

    # ------------------------------------------------------------------
    # Broker execution context
    # ------------------------------------------------------------------

    def _execution_context(self, symbol):
        """
        Obtain the live MT5 execution context.

        The MT5 service remains the single owner of broker-specific
        market and symbol information.
        """

        try:

            context = (
                mt5_service
                .get_symbol_execution_context(symbol)
            )

            if not isinstance(context, dict):
                return {}

            return context

        except Exception as exc:

            logger.error(
                "Unable to obtain execution context for %s: %s",
                symbol,
                exc,
            )

            return {}

    # ------------------------------------------------------------------
    # Price normalization
    # ------------------------------------------------------------------

    def _normalize_price(self, price, digits):
        """
        Normalize a broker price to the symbol's supported precision.
        """

        if price is None:
            return 0.0

        try:

            return round(
                float(price),
                int(digits),
            )

        except (TypeError, ValueError):

            return 0.0

    # ------------------------------------------------------------------
    # Order construction
    # ------------------------------------------------------------------

    def build(
        self,
        ai_decision,
        execution_risk,
        symbol=None,
    ):
        """
        Construct an OMS-compatible order only when execution
        risk has already approved the decision.

        State is maintained independently per symbol.
        """

        # --------------------------------------------------------------
        # Resolve symbol
        # --------------------------------------------------------------

        symbol = (
            symbol
            or ai_decision.get("symbol")
            or execution_risk.get("symbol")
            or self.DEFAULT_SYMBOL
        )

        symbol = self._ensure_symbol(symbol)
        state = self.states[symbol]

        # --------------------------------------------------------------
        # Risk gate
        # --------------------------------------------------------------

        if not execution_risk.get(
            "approved",
            False,
        ):

            state.update({

                "status":
                    "BLOCKED",

                "symbol":
                    symbol,

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return state

        # --------------------------------------------------------------
        # AI decision
        # --------------------------------------------------------------

        decision = ai_decision.get(
            "decision",
            "HOLD",
        )

        # --------------------------------------------------------------
        # EXIT
        #
        # EXIT closes an existing position identified by trade_id.
        # It is deliberately NOT priced here. ExecutionService owns
        # the fresh executable PAPER quote at the moment of close.
        # --------------------------------------------------------------

        if decision == "EXIT":

            trade_id = ai_decision.get(
                "trade_id"
            )

            if not trade_id:

                state.update({

                    "status":
                        "MISSING_TRADE_ID",

                    "symbol":
                        symbol,

                    "order_ready":
                        False,

                    "order_request":
                        None,

                    "last_update":
                        time.time(),

                })

                return state

            order = {

                "decision_id":
                    ai_decision.get(
                        "decision_id"
                    ),

                "symbol":
                    symbol,

                "type":
                    "EXIT",

                "volume":
                    ai_decision.get(
                        "volume",
                        self.DEFAULT_VOLUME,
                    ),

                "price":
                    0.0,

                "stop_loss":
                    0.0,

                "take_profit":
                    0.0,

                "trade_id":
                    trade_id,

                "position_side":
                    ai_decision.get(
                        "position_side"
                    ),

                "magic":
                    self.MAGIC_NUMBER,

                "comment":
                    "VolSim-Pro AI Exit",

            }

            state.update({

                "status":
                    "READY",

                "symbol":
                    symbol,

                "order_ready":
                    True,

                "order_request":
                    order,

                "last_update":
                    time.time(),

            })

            return state

        if decision not in (
            "BUY",
            "SELL",
        ):

            state.update({

                "status":
                    "WAITING",

                "symbol":
                    symbol,

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return state

        # --------------------------------------------------------------
        # Symbol
        # --------------------------------------------------------------

        symbol = ai_decision.get(
            "symbol",
            symbol,
        )

        symbol = self._ensure_symbol(symbol)
        state = self.states[symbol]

        # --------------------------------------------------------------
        # Volume
        # --------------------------------------------------------------

        volume = ai_decision.get(
            "volume",
            self.DEFAULT_VOLUME,
        )

        try:

            volume = float(volume)

        except (TypeError, ValueError):

            state.update({

                "status":
                    "ERROR",

                "symbol":
                    symbol,

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return state

        # --------------------------------------------------------------
        # Live MT5 execution context
        # --------------------------------------------------------------

        context = self._execution_context(
            symbol
        )

        if not context:

            state.update({

                "status":
                    "BROKER_CONTEXT_UNAVAILABLE",

                "symbol":
                    symbol,

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return state

        # --------------------------------------------------------------
        # Broker price
        #
        # BUY  -> ASK
        # SELL -> BID
        # --------------------------------------------------------------

        if decision == "BUY":

            market_price = context.get(
                "ask",
                0.0,
            )

        else:

            market_price = context.get(
                "bid",
                0.0,
            )

        digits = context.get(
            "digits",
            5,
        )

        price = self._normalize_price(
            market_price,
            digits,
        )

        if price <= 0:

            state.update({

                "status":
                    "INVALID_MARKET_PRICE",

                "symbol":
                    symbol,

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return state

        # --------------------------------------------------------------
        # Protective exits
        #
        # These are accepted from the upstream decision.
        # The builder does NOT invent them.
        # --------------------------------------------------------------

        stop_loss = ai_decision.get(
            "stop_loss",
            0.0,
        )

        take_profit = ai_decision.get(
            "take_profit",
            0.0,
        )

        stop_loss = self._normalize_price(
            stop_loss,
            digits,
        )

        take_profit = self._normalize_price(
            take_profit,
            digits,
        )

        # --------------------------------------------------------------
        # Construct normalized OMS order
        # --------------------------------------------------------------

        order = {

            "decision_id":
                ai_decision.get(
                    "decision_id"
                ),

            # Decision-time attribution context.
            # Analytical metadata only; does not affect execution.
            "trend":
                ai_decision.get(
                    "trend_signal"
                ),

            "regime":
                ai_decision.get(
                    "regime"
                ),

            "volatility":
                ai_decision.get(
                    "volatility"
                ),

            "confidence":
                ai_decision.get(
                    "confidence"
                ),

            "atr":
                ai_decision.get(
                    "atr"
                ),

            "rsi":
                ai_decision.get(
                    "rsi"
                ),

            "ema20":
                ai_decision.get(
                    "ema20"
                ),

            "ema50":
                ai_decision.get(
                    "ema50"
                ),

            "ema200":
                ai_decision.get(
                    "ema200"
                ),

            "spread":
                ai_decision.get(
                    "spread"
                ),

            "symbol":
                symbol,

            "type":
                decision,

            "volume":
                volume,

            "price":
                price,

            "stop_loss":
                stop_loss,

            "take_profit":
                take_profit,

            "magic":
                self.MAGIC_NUMBER,

            "comment":
                "VolSim-Pro AI Execution",

        }

        # --------------------------------------------------------------
        # Publish symbol-scoped builder state
        # --------------------------------------------------------------

        state.update({

            "status":
                "READY",

            "symbol":
                symbol,

            "order_ready":
                True,

            "order_request":
                order,

            "last_update":
                time.time(),

        })

        return state

    # ------------------------------------------------------------------
    # Snapshot
    # ------------------------------------------------------------------

    def snapshot(self, symbol=None):
        """
        Return the current Order Builder state.

        Without a symbol, preserve the historical XAUUSDm behavior.
        """

        if symbol is None:
            return self.state

        return self._state(symbol)

    def snapshot_all(self):
        """
        Return independent builder states for every active symbol.
        """

        return {
            symbol: dict(state)
            for symbol, state in self.states.items()
        }


order_builder_service = OrderBuilderService()



