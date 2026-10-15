import asyncio

import pytest

from src.services.execution_service import ExecutionService, oms_service


def make_service(monkeypatch, previous_record):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_rejected = 0
    service.last_error = None

    async def claim_existing_identity(client_order_id):
        return False, previous_record

    monkeypatch.setattr(
        service,
        "_claim_execution_idempotency",
        claim_existing_identity,
    )

    def unexpected_order_creation(order_request):
        pytest.fail("Duplicate request reached OMS order creation")

    monkeypatch.setattr(oms_service, "create_order", unexpected_order_creation)

    return service


def valid_entry_request():
    return {
        "action": "BUY",
        "decision_id": "test-decision",
        "client_order_id": "test-duplicate-id",
        "volume": 0.01,
        "price": 2500.0,
        "stop_loss": 2490.0,
        "symbol": "XAUUSDm",
    }


def test_incomplete_previous_result_fails_closed(monkeypatch):
    service = make_service(
        monkeypatch,
        {"client_order_id": "test-duplicate-id", "result": None},
    )

    result = asyncio.run(service.send_order(valid_entry_request()))

    assert result["retcode"] == "EXECUTION_STATE_UNRESOLVED"
    assert result["success"] is False
    assert result["retryable"] is False
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is None
    assert result["duplicate_execution"] is True


def test_uncertain_previous_transmission_requires_reconciliation(monkeypatch):
    service = make_service(
        monkeypatch,
        {
            "client_order_id": "test-duplicate-id",
            "result": {
                "success": False,
                "retcode": "TRANSMISSION_UNKNOWN",
                "message": "Outcome unknown",
            },
        },
    )

    result = asyncio.run(service.send_order(valid_entry_request()))

    assert result["retcode"] == "TRANSMISSION_UNKNOWN"
    assert result["success"] is False
    assert result["retryable"] is False
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is True
    assert result["duplicate_execution"] is True


def test_completed_identity_rejects_duplicate(monkeypatch):
    service = make_service(
        monkeypatch,
        {
            "client_order_id": "test-duplicate-id",
            "result": {
                "success": True,
                "order_id": 123,
                "ticket": 456,
                "retcode": "DONE",
            },
        },
    )

    result = asyncio.run(service.send_order(valid_entry_request()))

    assert result["retcode"] == "DUPLICATE_EXECUTION"
    assert result["success"] is False
    assert result["client_order_id"] == "test-duplicate-id"


def test_transmission_exception_persists_reconciliation_flags(monkeypatch):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "LIVE"
    service.orders_rejected = 0
    service.orders_sent = 0
    service.orders_filled = 0
    service.last_order_time = None
    service.last_fill_time = None
    service.last_error = None
    service.execution_latency_ms = 0

    captured = {}

    async def claim_identity(client_order_id):
        return True, None

    async def capture_finalization(client_order_id, result, oms_order_id=None):
        captured["client_order_id"] = client_order_id
        captured["result"] = result
        captured["oms_order_id"] = oms_order_id

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_identity)
    monkeypatch.setattr(service, "_finalize_execution_idempotency", capture_finalization)
    monkeypatch.setattr(
        execution_module.oms_service,
        "create_order",
        lambda request: {"order_id": "mock-order-id"},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        execution_module.risk_engine_service,
        "approve_order",
        lambda request: {"approved": True},
    )
    monkeypatch.setattr(
        execution_module.execution_guard_service,
        "evaluate",
        lambda **kwargs: {"allowed": True, "status": "TEST_APPROVED"},
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "order_check",
        lambda request: SimpleNamespace(retcode=0, comment="mock pass"),
    )

    def mock_order_send(request):
        raise RuntimeError("mock transmission exception; no real broker call")

    monkeypatch.setattr(execution_module.mt5, "order_send", mock_order_send)

    request = {
        "action": "BUY",
        "type": "BUY",
        "decision_id": "step462H-test-decision",
        "client_order_id": "step462H-mock-only",
        "live_transmission_authorized": True,
        "volume": 0.01,
        "price": 2500.0,
        "stop_loss": 2490.0,
        "symbol": "XAUUSDm",
    }

    result = asyncio.run(service.send_order(request))

    assert result["retcode"] == "TRANSMISSION_UNKNOWN"
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is True
    assert captured["client_order_id"] == "step462H-mock-only"
    assert captured["result"]["retcode"] == "TRANSMISSION_UNKNOWN"
    assert captured["result"].get("reconciliation_required") is True
    assert captured["result"].get("broker_transmission_started") is True
@pytest.mark.parametrize(
    ("invalid_field", "expected_retcode"),
    [
        ("decision_id", "AI_PROVENANCE_REQUIRED"),
        ("volume", "INVALID_RISK_SIZING_VOLUME"),
        ("price", "INVALID_MARKET_PRICE"),
        ("stop_loss", "INVALID_PROTECTIVE_STOP"),
    ],
)
def test_invalid_entry_retry_rejects_existing_identity_without_release(
    monkeypatch, invalid_field, expected_retcode
):
    service = make_service(
        monkeypatch,
        {
            "client_order_id": "test-duplicate-id",
            "status": "SUCCESS",
            "result": {
                "success": True,
                "order_id": 123,
                "ticket": 456,
                "retcode": "DONE",
            },
        },
    )
    released = []

    async def capture_release(client_order_id):
        released.append(client_order_id)

    monkeypatch.setattr(service, "_release_execution_idempotency", capture_release)

    request = valid_entry_request()
    if invalid_field == "decision_id":
        request.pop("decision_id")
    else:
        request[invalid_field] = 0

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == "DUPLICATE_EXECUTION"
    assert result["client_order_id"] == "test-duplicate-id"
    assert released == []


@pytest.mark.parametrize(
    ("invalid_field", "expected_retcode"),
    [
        ("decision_id", "AI_PROVENANCE_REQUIRED"),
        ("volume", "INVALID_RISK_SIZING_VOLUME"),
        ("price", "INVALID_MARKET_PRICE"),
        ("stop_loss", "INVALID_PROTECTIVE_STOP"),
    ],
)
def test_invalid_new_entry_releases_its_own_claim(
    monkeypatch, invalid_field, expected_retcode
):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_rejected = 0
    service.last_error = None
    released = []

    async def claim_new_identity(client_order_id):
        return True, None

    async def capture_release(client_order_id):
        released.append(client_order_id)

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_new_identity)
    monkeypatch.setattr(service, "_release_execution_idempotency", capture_release)
    monkeypatch.setattr(
        oms_service,
        "create_order",
        lambda request: pytest.fail("Invalid entry reached OMS order creation"),
    )

    request = valid_entry_request()
    request["client_order_id"] = "test-new-invalid-id"
    if invalid_field == "decision_id":
        request.pop("decision_id")
    else:
        request[invalid_field] = 0

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == expected_retcode
    assert result["broker_transmission_started"] is False
    assert result["duplicate_execution"] is False
    assert released == ["test-new-invalid-id"]


def test_invalid_new_entry_release_failure_fails_closed(monkeypatch):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_rejected = 0
    service.last_error = None

    async def claim_new_identity(client_order_id):
        return True, None

    async def fail_release(client_order_id):
        raise RuntimeError("mock release failure")

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_new_identity)
    monkeypatch.setattr(service, "_release_execution_idempotency", fail_release)
    monkeypatch.setattr(
        oms_service,
        "create_order",
        lambda request: pytest.fail("Invalid entry reached OMS order creation"),
    )

    request = valid_entry_request()
    request["client_order_id"] = "test-release-failure-id"
    request["volume"] = 0

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == "EXECUTION_STATE_UNRESOLVED"
    assert result["retryable"] is False
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is False
    assert result["duplicate_execution"] is False


def test_oms_creation_exception_fails_closed_without_claim_release(monkeypatch):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_rejected = 0
    service.last_error = None

    captured = {"released": [], "finalized": []}

    async def claim_new_identity(client_order_id):
        return True, None

    async def capture_release(client_order_id):
        captured["released"].append(client_order_id)

    async def capture_finalization(client_order_id, result, oms_order_id=None):
        captured["finalized"].append({
            "client_order_id": client_order_id,
            "result": result,
            "oms_order_id": oms_order_id,
        })

    def fail_oms_creation(request):
        raise RuntimeError("mock OMS creation failure")

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_new_identity)
    monkeypatch.setattr(service, "_release_execution_idempotency", capture_release)
    monkeypatch.setattr(service, "_finalize_execution_idempotency", capture_finalization)
    monkeypatch.setattr(oms_service, "create_order", fail_oms_creation)

    request = valid_entry_request()
    request["client_order_id"] = "test-oms-creation-exception"

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == "EXECUTION_STATE_UNRESOLVED"
    assert result["retryable"] is False
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is False
    assert result["duplicate_execution"] is False
    assert result["client_order_id"] == "test-oms-creation-exception"
    assert service.last_error == "EXECUTION_STATE_UNRESOLVED"
    assert captured["released"] == []


def test_duplicate_unresolved_oms_state_preserves_no_transmission_flag(monkeypatch):
    service = make_service(
        monkeypatch,
        {
            "client_order_id": "test-oms-unresolved-duplicate",
            "status": "FAILED",
            "result": {
                "success": False,
                "retcode": "EXECUTION_STATE_UNRESOLVED",
                "reconciliation_required": True,
                "broker_transmission_started": False,
                "retryable": False,
            },
        },
    )

    request = valid_entry_request()
    request["client_order_id"] = "test-oms-unresolved-duplicate"

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == "EXECUTION_STATE_UNRESOLVED"
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is False
    assert result["duplicate_execution"] is True
    assert result["retryable"] is False
