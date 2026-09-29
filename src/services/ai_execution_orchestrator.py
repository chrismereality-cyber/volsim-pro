import time

from src.services.execution_queue_service import execution_queue_service
from src.services.execution_service import execution_service


class AIExecutionOrchestrator:
    """
    Enterprise AI Execution Orchestrator.

    Pipeline:

        Order Builder
              ↓
        Execution Queue
              ↓
        Queue Dispatch
              ↓
        Execution Service
              ↓
        OMS / Position Service

    The orchestrator consumes an already-approved order.
    It does not calculate risk.

    Execution infrastructure remains centralized.
    Orchestration state is maintained independently per symbol.
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

        # Backward-compatible XAUUSDm alias.
        self.state = self.states[self.DEFAULT_SYMBOL]

        self._last_signatures = {
            symbol: None
            for symbol in self.ACTIVE_SYMBOLS
        }

    # ------------------------------------------------------------------
    # State helpers
    # ------------------------------------------------------------------

    def _empty_state(self, symbol):

        return {
            "status": "ONLINE",
            "symbol": symbol,
            "execution_signal": "NONE",
            "last_action": "WAITING",
            "last_order": None,
            "last_result": None,
            "last_update": time.time(),
            "queue": execution_queue_service.snapshot(),
        }

    def _ensure_symbol(self, symbol):

        if not symbol:
            symbol = self.DEFAULT_SYMBOL

        if symbol not in self.states:
            self.states[symbol] = self._empty_state(symbol)
            self._last_signatures[symbol] = None

        return symbol

    # ------------------------------------------------------------------
    # Evaluation
    # ------------------------------------------------------------------

    async def evaluate(
        self,
        order_state,
        symbol=None,
        ai_execution=None,
    ):
        """
        Process an already-approved order.

        The execution queue and execution service remain global.
        Only orchestration state and duplicate protection are
        symbol-scoped.
        """

        # --------------------------------------------------------------
        # Resolve symbol from explicit argument or order state
        # --------------------------------------------------------------

        symbol = (
            symbol
            or order_state.get("symbol")
            or (
                order_state.get("order_request") or {}
            ).get("symbol")
            or self.DEFAULT_SYMBOL
        )

        symbol = self._ensure_symbol(symbol)
        state = self.states[symbol]

        state["last_update"] = time.time()

        # --------------------------------------------------------------
        # 1. Validate Order Builder state
        # --------------------------------------------------------------

        if not order_state.get(
            "order_ready",
            False,
        ):

            state["execution_signal"] = "NONE"
            state["last_action"] = "WAITING"
            state["last_order"] = None
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        # --------------------------------------------------------------
        # 2. Validate AI Execution Authorization
        # --------------------------------------------------------------
        #
        # AI Execution Policy is the explicit authorization boundary.
        # The orchestrator must never dispatch an order unless the AI
        # execution service has explicitly returned READY.
        #
        # This is intentionally checked before request extraction,
        # queue insertion, or execution-service dispatch.
        # --------------------------------------------------------------

        if ai_execution is None:
            ai_execution = {}

        if ai_execution.get("status") != "READY":
            state["execution_signal"] = "NONE"
            state["last_action"] = (
                "AI_EXECUTION_NOT_AUTHORIZED"
            )
            state["last_order"] = None
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        if ai_execution.get(
            "last_action"
        ) != "EXECUTION_READY":
            state["execution_signal"] = "NONE"
            state["last_action"] = (
                "AI_EXECUTION_NOT_AUTHORIZED"
            )
            state["last_order"] = None
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        # --------------------------------------------------------------
        # 3. Extract order request
        # --------------------------------------------------------------

        request = order_state.get(
            "order_request"
        )

        if not request:

            state["execution_signal"] = "NONE"
            state["last_action"] = "INVALID_REQUEST"
            state["last_order"] = None
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        # --------------------------------------------------------------
        # 3. Resolve request symbol
        # --------------------------------------------------------------

        request_symbol = request.get(
            "symbol",
            symbol,
        )

        request_symbol = self._ensure_symbol(
            request_symbol
        )

        if request_symbol != symbol:

            symbol = request_symbol
            state = self.states[symbol]
            state["last_update"] = time.time()

        # --------------------------------------------------------------
        # 4. Validate order fields
        # --------------------------------------------------------------

        order_type = request.get("type")
        volume = request.get("volume")
        decision_id = request.get("decision_id")
        trade_id = request.get("trade_id")

        if not symbol or order_type not in (
            "BUY",
            "SELL",
            "EXIT",
        ):

            state["execution_signal"] = "NONE"
            state["last_action"] = "INVALID_ORDER"
            state["last_order"] = request

            return state

        if order_type == "EXIT" and not trade_id:

            state["execution_signal"] = "NONE"
            state["last_action"] = "MISSING_TRADE_ID"
            state["last_order"] = request

            return state

            state["execution_signal"] = "NONE"
            state["last_action"] = "INVALID_ORDER"
            state["last_order"] = request

            return state

        try:

            normalized_volume = float(volume)

        except (TypeError, ValueError):

            normalized_volume = 0.0

        if normalized_volume <= 0:

            state["execution_signal"] = "NONE"
            state["last_action"] = "INVALID_VOLUME"
            state["last_order"] = request

            return state

        # --------------------------------------------------------------
        # 5. Duplicate protection
        # --------------------------------------------------------------

        signature = (
            decision_id,
            symbol,
            order_type,
            normalized_volume,
            trade_id if order_type == "EXIT" else None,
        )

        if signature == self._last_signatures.get(symbol):

            state["execution_signal"] = order_type
            state["last_action"] = "DUPLICATE_SKIPPED"
            state["last_order"] = request
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        self._last_signatures[symbol] = signature

        state["execution_signal"] = order_type
        state["last_order"] = request
        state["decision_id"] = decision_id

        # --------------------------------------------------------------
        # 6. Enqueue order
        # --------------------------------------------------------------

        queued = execution_queue_service.enqueue(
            request
        )

        if not queued:

            state["last_action"] = "QUEUE_REJECTED"
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        state["last_action"] = "QUEUED"

        state["queue"] = (
            execution_queue_service.snapshot()
        )

        # --------------------------------------------------------------
        # 7. Dispatch order
        # --------------------------------------------------------------

        queued_order = execution_queue_service.next_order()

        if not queued_order:

            state["last_action"] = "QUEUE_EMPTY"
            state["queue"] = (
                execution_queue_service.snapshot()
            )

            return state

        state["last_action"] = "DISPATCHING"

        # --------------------------------------------------------------
        # 8. Send to centralized Execution Service
        # --------------------------------------------------------------

        try:

            result = await execution_service.send_order(
                queued_order
            )

        except Exception as exc:

            state["last_action"] = (
                "EXECUTION_EXCEPTION"
            )

            state["last_result"] = {
                "success": False,
                "error": str(exc),
            }

            state["queue"] = (
                execution_queue_service.snapshot()
            )

            state["last_update"] = time.time()

            return state

        # --------------------------------------------------------------
        # 9. Record result
        # --------------------------------------------------------------

        state["last_result"] = result

        state["last_action"] = (
            "ORDER_SENT"
            if result.get("success")
            else "ORDER_FAILED"
        )

        state["last_order"] = queued_order

        state["queue"] = (
            execution_queue_service.snapshot()
        )

        state["last_update"] = time.time()

        return state

    # ------------------------------------------------------------------
    # Snapshots
    # ------------------------------------------------------------------

    def snapshot(self, symbol=None):
        """
        Return the current orchestration state.

        Without a symbol, preserve historical XAUUSDm behavior.
        """

        if symbol is None:
            symbol = self.DEFAULT_SYMBOL

        symbol = self._ensure_symbol(symbol)

        state = self.states[symbol]

        state["queue"] = (
            execution_queue_service.snapshot()
        )

        return state

    def snapshot_all(self):
        """
        Return independent orchestration state for every symbol.
        """

        queue_state = execution_queue_service.snapshot()

        snapshots = {}

        for symbol, state in self.states.items():

            state["queue"] = queue_state

            snapshots[symbol] = dict(state)

        return snapshots


ai_execution_orchestrator = AIExecutionOrchestrator()

