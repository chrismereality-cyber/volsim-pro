import time
from collections import deque


class ExecutionQueueService:
    """
    Enterprise Execution Queue.

    Owns:
    - queued execution requests
    - execution ordering
    - duplicate prevention
    - execution statistics

    Does NOT:
    - calculate risk
    - make AI decisions
    - execute broker orders
    """

    def __init__(self):

        self.queue = deque()

        self.state = {
            "status": "ONLINE",
            "queued_orders": 0,
            "processed_orders": 0,
            "rejected_duplicates": 0,
            "last_enqueue": None,
            "last_dispatch": None,
            "last_order_id": None
        }

        self._queued_keys = set()


    def _order_key(self, order_request: dict):

        if not order_request:
            return None

        return (
            order_request.get("symbol"),
            order_request.get("type"),
            order_request.get("volume"),
            order_request.get("price"),
            order_request.get("stop_loss"),
            order_request.get("take_profit")
        )


    def enqueue(self, order_request: dict):

        if not isinstance(order_request, dict):
            return False

        if not order_request:
            return False

        key = self._order_key(order_request)

        if key in self._queued_keys:

            self.state["rejected_duplicates"] += 1

            return False

        self.queue.append(order_request)

        self._queued_keys.add(key)

        self.state["queued_orders"] = len(self.queue)

        self.state["last_enqueue"] = time.time()

        self.state["last_order_id"] = (
            order_request.get("order_id")
        )

        return True


    def next_order(self):

        if not self.queue:

            self.state["queued_orders"] = 0

            return None

        order = self.queue.popleft()

        key = self._order_key(order)

        self._queued_keys.discard(key)

        self.state["queued_orders"] = len(self.queue)

        self.state["processed_orders"] += 1

        self.state["last_dispatch"] = time.time()

        self.state["last_order_id"] = (
            order.get("order_id")
        )

        return order


    def clear(self):

        self.queue.clear()

        self._queued_keys.clear()

        self.state["queued_orders"] = 0

        return True


    def size(self):

        return len(self.queue)


    def snapshot(self):

        return {
            **self.state,
            "queued_orders": len(self.queue)
        }


execution_queue_service = ExecutionQueueService()
