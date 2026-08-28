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
    - expose builder state

    Does NOT:
    - calculate risk
    - bypass risk
    - execute trades
    - manage positions
    - determine trading strategy
    - invent stop-loss or take-profit levels
    """

    DEFAULT_SYMBOL = "XAUUSDm"
    DEFAULT_VOLUME = 0.01
    MAGIC_NUMBER = 202607

    def __init__(self):

        self.state = {
            "status": "STANDBY",
            "order_ready": False,
            "order_request": None,
            "last_update": time.time(),
        }

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
    ):
        """
        Construct an OMS-compatible order only when execution
        risk has already approved the decision.
        """

        # --------------------------------------------------------------
        # Risk gate
        # --------------------------------------------------------------

        if not execution_risk.get(
            "approved",
            False,
        ):

            self.state.update({

                "status":
                    "BLOCKED",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return self.state

        # --------------------------------------------------------------
        # AI decision
        # --------------------------------------------------------------

        decision = ai_decision.get(
            "decision",
            "HOLD",
        )

        if decision not in (
            "BUY",
            "SELL",
        ):

            self.state.update({

                "status":
                    "WAITING",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return self.state

        # --------------------------------------------------------------
        # Symbol
        # --------------------------------------------------------------

        symbol = ai_decision.get(
            "symbol",
            self.DEFAULT_SYMBOL,
        )

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

            self.state.update({

                "status":
                    "ERROR",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return self.state

        # --------------------------------------------------------------
        # Live MT5 execution context
        # --------------------------------------------------------------

        context = self._execution_context(
            symbol
        )

        if not context:

            self.state.update({

                "status":
                    "BROKER_CONTEXT_UNAVAILABLE",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return self.state

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

            self.state.update({

                "status":
                    "INVALID_MARKET_PRICE",

                "order_ready":
                    False,

                "order_request":
                    None,

                "last_update":
                    time.time(),

            })

            return self.state

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
        # Publish builder state
        # --------------------------------------------------------------

        self.state.update({

            "status":
                "READY",

            "order_ready":
                True,

            "order_request":
                order,

            "last_update":
                time.time(),

        })

        return self.state

    # ------------------------------------------------------------------
    # Snapshot
    # ------------------------------------------------------------------

    def snapshot(self):
        """
        Return the current Order Builder state.
        """

        return self.state


order_builder_service = OrderBuilderService()
