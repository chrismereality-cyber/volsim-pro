
import time

from src.services.execution_queue_service import execution_queue_service
from src.services.execution_service import execution_service


class AIExecutionOrchestrator:
    """
    Enterprise AI Execution Orchestrator.

    Pipeline:

        Order Builder
              ?
        Execution Queue
              ?
        Queue Dispatch
              ?
        Execution Service
              ?
        OMS / Position Service

    This orchestrator consumes an already-approved order.
    It does not calculate risk.
    """

    def __init__(self):

        self.state = {
            "status": "ONLINE",
            "execution_signal": "NONE",
            "last_action": "WAITING",
            "last_order": None,
            "last_result": None,
            "last_update": time.time(),
            "queue": execution_queue_service.snapshot()
        }

        self._last_signature = None

    async def evaluate(self, order_state):

        self.state["last_update"] = time.time()

        # --------------------------------------------------
        # 1. Validate Order Builder state
        # --------------------------------------------------

        if not order_state.get("order_ready", False):

            self.state["execution_signal"] = "NONE"
            self.state["last_action"] = "WAITING"
            self.state["last_order"] = None
            self.state["queue"] = (
                execution_queue_service.snapshot()
            )

            return self.state

        # --------------------------------------------------
        # 2. Extract order request
        # --------------------------------------------------

        request = order_state.get("order_request")

        if not request:

            self.state["execution_signal"] = "NONE"
            self.state["last_action"] = "INVALID_REQUEST"
            self.state["last_order"] = None
            self.state["queue"] = (
                execution_queue_service.snapshot()
            )

            return self.state

        # --------------------------------------------------
        # 3. Validate order fields
        # --------------------------------------------------

        symbol = request.get("symbol")
        order_type = request.get("type")
        volume = request.get("volume")

        if not symbol or order_type not in ("BUY", "SELL"):

            self.state["execution_signal"] = "NONE"
            self.state["last_action"] = "INVALID_ORDER"
            self.state["last_order"] = request

            return self.state

        if volume is None or float(volume) <= 0:

            self.state["execution_signal"] = "NONE"
            self.state["last_action"] = "INVALID_VOLUME"
            self.state["last_order"] = request

            return self.state

        # --------------------------------------------------
        # 4. Duplicate protection
        # --------------------------------------------------

        signature = (
            symbol,
            order_type,
            float(volume)
        )

        if signature == self._last_signature:

            self.state["execution_signal"] = order_type
            self.state["last_action"] = "DUPLICATE_SKIPPED"
            self.state["last_order"] = request
            self.state["queue"] = (
                execution_queue_service.snapshot()
            )

            return self.state

        self._last_signature = signature

        self.state["execution_signal"] = order_type
        self.state["last_order"] = request

        # --------------------------------------------------
        # 5. Enqueue order
        # --------------------------------------------------

        queued = execution_queue_service.enqueue(request)

        if not queued:

            self.state["last_action"] = "QUEUE_REJECTED"
            self.state["queue"] = (
                execution_queue_service.snapshot()
            )

            return self.state

        self.state["last_action"] = "QUEUED"

        self.state["queue"] = (
            execution_queue_service.snapshot()
        )

        # --------------------------------------------------
        # 6. Dispatch order
        # --------------------------------------------------

        queued_order = execution_queue_service.next_order()

        if not queued_order:

            self.state["last_action"] = "QUEUE_EMPTY"
            self.state["queue"] = (
                execution_queue_service.snapshot()
            )

            return self.state

        self.state["last_action"] = "DISPATCHING"

        # --------------------------------------------------
        # 7. Send to Execution Service
        # --------------------------------------------------

        try:

            result = await execution_service.send_order(
                queued_order
            )

        except Exception as exc:

            self.state["last_action"] = "EXECUTION_EXCEPTION"

            self.state["last_result"] = {
                "success": False,
                "error": str(exc)
            }

            self.state["queue"] = (
                execution_queue_service.snapshot()
            )

            self.state["last_update"] = time.time()

            return self.state

        # --------------------------------------------------
        # 8. Record result
        # --------------------------------------------------

        self.state["last_result"] = result

        self.state["last_action"] = (
            "ORDER_SENT"
            if result.get("success")
            else "ORDER_FAILED"
        )

        self.state["last_order"] = queued_order

        self.state["queue"] = (
            execution_queue_service.snapshot()
        )

        self.state["last_update"] = time.time()

        return self.state

    def snapshot(self):

        self.state["queue"] = (
            execution_queue_service.snapshot()
        )

        return self.state


ai_execution_orchestrator = AIExecutionOrchestrator()
