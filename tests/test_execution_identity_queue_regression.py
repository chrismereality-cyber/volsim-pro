import asyncio

from src.services import ai_execution_orchestrator as orchestrator_module
from src.services.execution_queue_service import ExecutionQueueService


class FakeExecutionService:
    def __init__(self, raises=False):
        self.requests = []
        self.raises = raises

    async def send_order(self, request):
        self.requests.append(dict(request))
        if self.raises:
            raise RuntimeError("simulated dispatch exception")
        return {"success": True, "status": "PAPER_TEST_ONLY"}


class QueueProxy:
    def __init__(self):
        self.inner = ExecutionQueueService()
        self.reject_once = False
        self.steal_once = False

    def enqueue(self, request):
        if self.reject_once:
            self.reject_once = False
            return False
        accepted = self.inner.enqueue(request)
        if accepted and self.steal_once:
            self.steal_once = False
            self.inner.next_order()
        return accepted

    def next_order(self):
        return self.inner.next_order()

    def snapshot(self):
        return self.inner.snapshot()


def make_request(**overrides):
    request = {
        "symbol": "XAUUSDm",
        "type": "BUY",
        "volume": 0.01,
        "decision_id": "DECISION-test-001",
    }
    request.update(overrides)
    return request


def make_orchestrator(monkeypatch, queue=None, execution=None):
    queue = queue or QueueProxy()
    execution = execution or FakeExecutionService()
    monkeypatch.setattr(orchestrator_module, "execution_queue_service", queue)
    monkeypatch.setattr(orchestrator_module, "execution_service", execution)
    return orchestrator_module.AIExecutionOrchestrator(), queue, execution


def evaluate(orchestrator, request):
    return asyncio.run(
        orchestrator.evaluate(
            {"order_ready": True, "order_request": request},
            ai_execution={
                "status": "READY",
                "last_action": "EXECUTION_READY",
            },
        )
    )


def test_existing_idempotency_key_is_preserved(monkeypatch):
    orchestrator, _, execution = make_orchestrator(monkeypatch)
    request = make_request(idempotency_key="caller-key-123")

    state = evaluate(orchestrator, request)

    assert state["last_action"] == "ORDER_SENT"
    assert request["idempotency_key"] == "caller-key-123"
    assert "client_order_id" not in request
    assert execution.requests[0]["idempotency_key"] == "caller-key-123"


def test_generated_identity_is_stable_for_same_decision(monkeypatch):
    orchestrator, _, execution = make_orchestrator(monkeypatch)
    request = make_request()

    first_action = evaluate(orchestrator, request)["last_action"]
    generated_id = request["client_order_id"]
    second_action = evaluate(orchestrator, make_request())["last_action"]

    assert first_action == "ORDER_SENT"
    assert generated_id.startswith("VOLSIM-")
    assert second_action == "DUPLICATE_SKIPPED"
    assert len(execution.requests) == 1


def test_distinct_exit_trade_ids_get_distinct_identities(monkeypatch):
    orchestrator, _, execution = make_orchestrator(monkeypatch)

    first_request = make_request(type="EXIT", trade_id="trade-A")
    second_request = make_request(type="EXIT", trade_id="trade-B")

    first = evaluate(orchestrator, first_request)
    second = evaluate(orchestrator, second_request)

    assert first["last_action"] == "ORDER_SENT"
    assert second["last_action"] == "ORDER_SENT"
    assert first_request["client_order_id"] != second_request["client_order_id"]
    assert len(execution.requests) == 2


def test_queue_deduplicates_explicit_identity_while_queued():
    queue = ExecutionQueueService()
    first = make_request(idempotency_key="same-key")
    second = make_request(idempotency_key="same-key", price=999)

    assert queue.enqueue(first) is True
    assert queue.enqueue(second) is False
    assert queue.snapshot()["rejected_duplicates"] == 1


def test_queue_distinguishes_exit_trade_ids():
    queue = ExecutionQueueService()
    first = make_request(type="EXIT", trade_id="trade-A")
    second = make_request(type="EXIT", trade_id="trade-B")

    assert queue.enqueue(first) is True
    assert queue.enqueue(second) is True
    assert queue.size() == 2


def test_queue_rejection_does_not_poison_retry(monkeypatch):
    orchestrator, queue, execution = make_orchestrator(monkeypatch)
    queue.reject_once = True

    first_action = evaluate(orchestrator, make_request())["last_action"]
    second_action = evaluate(orchestrator, make_request())["last_action"]

    assert first_action == "QUEUE_REJECTED"
    assert second_action == "ORDER_SENT"
    assert len(execution.requests) == 1


def test_empty_dequeue_does_not_poison_retry(monkeypatch):
    orchestrator, queue, execution = make_orchestrator(monkeypatch)
    # Simulate another consumer removing the item between enqueue and dequeue.
    queue.steal_once = True

    first_action = evaluate(orchestrator, make_request())["last_action"]
    second_action = evaluate(orchestrator, make_request())["last_action"]

    assert first_action == "QUEUE_EMPTY"
    assert second_action == "ORDER_SENT"
    assert len(execution.requests) == 1


def test_dispatch_exception_retains_duplicate_protection(monkeypatch):
    execution = FakeExecutionService(raises=True)
    orchestrator, _, _ = make_orchestrator(monkeypatch, execution=execution)

    first_action = evaluate(orchestrator, make_request())["last_action"]
    second_action = evaluate(orchestrator, make_request())["last_action"]

    assert first_action == "EXECUTION_EXCEPTION"
    assert second_action == "DUPLICATE_SKIPPED"
    assert len(execution.requests) == 1
