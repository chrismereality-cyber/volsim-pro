import asyncio

import pytest

from src.services.execution_service import ExecutionService, oms_service


def test_broker_account_verification_rejects_unsupported_mode(monkeypatch):
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)

    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: pytest.fail("Unsupported mode must not inspect MT5"),
    )

    result = service._verify_broker_account_mode("PAPER")

    assert result["ok"] is False
    assert result["code"] == "UNSUPPORTED_BROKER_MODE"


@pytest.mark.parametrize(
    "terminal",
    [
        None,
        pytest.param(
            __import__("types").SimpleNamespace(connected=False),
            id="disconnected-terminal",
        ),
    ],
)
def test_broker_account_verification_rejects_missing_or_disconnected_terminal(
    monkeypatch, terminal
):
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    monkeypatch.setattr(execution_module.mt5, "terminal_info", lambda: terminal)
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: pytest.fail("Account lookup must not follow a disconnected terminal"),
    )

    result = service._verify_broker_account_mode("DEMO")

    assert result["ok"] is False
    assert result["code"] == "MT5_TERMINAL_NOT_CONNECTED"


def test_broker_account_verification_rejects_unavailable_account(monkeypatch):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(execution_module.mt5, "account_info", lambda: None)

    result = service._verify_broker_account_mode("DEMO")

    assert result["ok"] is False
    assert result["code"] == "MT5_ACCOUNT_UNAVAILABLE"


@pytest.mark.parametrize(
    ("expected_mode", "constant_name"),
    [
        ("DEMO", "ACCOUNT_TRADE_MODE_DEMO"),
        ("LIVE", "ACCOUNT_TRADE_MODE_REAL"),
    ],
)
def test_broker_account_verification_accepts_matching_account_mode(
    monkeypatch, expected_mode, constant_name
):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    expected_trade_mode = getattr(execution_module.mt5, constant_name)

    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: SimpleNamespace(
            trade_mode=expected_trade_mode,
            margin_mode=getattr(
                execution_module.mt5,
                "ACCOUNT_MARGIN_MODE_RETAIL_HEDGING",
                None,
            ),
        ),
    )

    result = service._verify_broker_account_mode(expected_mode)

    assert result["ok"] is True
    assert result["code"] == "MT5_ACCOUNT_MODE_VERIFIED"


def test_demo_account_verification_rejects_netting_mode(monkeypatch):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: SimpleNamespace(
            trade_mode=execution_module.mt5.ACCOUNT_TRADE_MODE_DEMO,
            margin_mode=execution_module.mt5.ACCOUNT_MARGIN_MODE_RETAIL_NETTING,
        ),
    )

    result = service._verify_broker_account_mode("DEMO")

    assert result["ok"] is False
    assert result["code"] == "MT5_ACCOUNT_MARGIN_MODE_MISMATCH"


def test_demo_account_verification_rejects_missing_hedging_constant(monkeypatch):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: SimpleNamespace(
            trade_mode=execution_module.mt5.ACCOUNT_TRADE_MODE_DEMO,
            margin_mode=execution_module.mt5.ACCOUNT_MARGIN_MODE_RETAIL_HEDGING,
        ),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "ACCOUNT_MARGIN_MODE_RETAIL_HEDGING",
        None,
    )

    result = service._verify_broker_account_mode("DEMO")

    assert result["ok"] is False
    assert result["code"] == "MT5_ACCOUNT_MARGIN_MODE_MISMATCH"


def test_broker_account_verification_rejects_account_mode_mismatch(monkeypatch):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    demo_mode = execution_module.mt5.ACCOUNT_TRADE_MODE_DEMO
    real_mode = execution_module.mt5.ACCOUNT_TRADE_MODE_REAL

    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: SimpleNamespace(trade_mode=real_mode),
    )

    result = service._verify_broker_account_mode("DEMO")

    assert demo_mode != real_mode
    assert result["ok"] is False
    assert result["code"] == "MT5_ACCOUNT_MODE_MISMATCH"


def test_broker_account_verification_rejects_missing_mode_constant(monkeypatch):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)
    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: SimpleNamespace(trade_mode=0),
    )
    monkeypatch.setattr(execution_module.mt5, "ACCOUNT_TRADE_MODE_DEMO", None)

    result = service._verify_broker_account_mode("DEMO")

    assert result["ok"] is False
    assert result["code"] == "MT5_ACCOUNT_MODE_MISMATCH"


@pytest.mark.parametrize(
    ("method_name", "expected_code"),
    [
        ("terminal_info", "MT5_ACCOUNT_VERIFICATION_ERROR"),
        ("account_info", "MT5_ACCOUNT_VERIFICATION_ERROR"),
    ],
)
def test_broker_account_verification_handles_mt5_inspection_exceptions(
    monkeypatch, method_name, expected_code
):
    from types import SimpleNamespace
    from src.services import execution_service as execution_module

    service = ExecutionService.__new__(ExecutionService)

    monkeypatch.setattr(
        execution_module.mt5,
        "terminal_info",
        lambda: SimpleNamespace(connected=True),
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "account_info",
        lambda: SimpleNamespace(
            trade_mode=execution_module.mt5.ACCOUNT_TRADE_MODE_DEMO
        ),
    )

    def raise_inspection_error():
        raise RuntimeError("controlled MT5 inspection failure")

    monkeypatch.setattr(
        execution_module.mt5,
        method_name,
        raise_inspection_error,
    )

    result = service._verify_broker_account_mode("DEMO")

    assert result["ok"] is False
    assert result["code"] == expected_code



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


@pytest.mark.parametrize(
    ("action", "price", "stop_loss"),
    [
        ("BUY", 2500.0, 2500.0),
        ("BUY", 2500.0, 2510.0),
        ("SELL", 2500.0, 2500.0),
        ("SELL", 2500.0, 2490.0),
    ],
)
def test_wrong_side_protective_stop_rejects_before_oms_and_releases_claim(
    monkeypatch, action, price, stop_loss
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
        lambda request: pytest.fail("Invalid stop direction reached OMS creation"),
    )

    request = valid_entry_request()
    request["action"] = action
    request["client_order_id"] = f"wrong-side-{action.lower()}-stop"
    request["price"] = price
    request["stop_loss"] = stop_loss

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == "INVALID_PROTECTIVE_STOP_DIRECTION"
    assert result["broker_transmission_started"] is False
    assert result["duplicate_execution"] is False
    assert released == [request["client_order_id"]]
    assert service.last_error == "ENTRY_EXECUTION_INVALID_STOP_DIRECTION"



def test_live_exit_missing_trade_id_bypasses_entry_stop_guard(monkeypatch):
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

    released = []
    status_updates = []
    broker_calls = []

    async def claim_new_identity(client_order_id):
        return True, None

    async def capture_release(client_order_id):
        released.append(client_order_id)

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_new_identity)
    monkeypatch.setattr(service, "_release_execution_idempotency", capture_release)
    monkeypatch.setattr(
        execution_module.oms_service,
        "create_order",
        lambda request: {"order_id": "mock-live-exit-order"},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda *args, **kwargs: status_updates.append((args, kwargs)),
    )
    monkeypatch.setattr(
        service,
        "_finalize_execution_idempotency",
        lambda *args, **kwargs: pytest.fail(
            "Missing-trade-ID rejection should release, not finalize, the claim"
        ),
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

    def forbid_broker_transmission(*args, **kwargs):
        broker_calls.append((args, kwargs))
        pytest.fail("EXIT validation unexpectedly attempted broker transmission")

    monkeypatch.setattr(execution_module.mt5, "order_send", forbid_broker_transmission)

    request = {
        "action": "EXIT",
        "type": "EXIT",
        "client_order_id": "test-live-exit-missing-trade-id",
        "live_transmission_authorized": True,
        "symbol": "XAUUSDm",
        "volume": 0.01,
        "price": 2500.0,
        "stop_loss": 2490.0,
    }

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == "MISSING_TRADE_ID"
    assert result["client_order_id"] == request["client_order_id"]
    assert result["retcode"] != "INVALID_PROTECTIVE_STOP_DIRECTION"
    assert released == [request["client_order_id"]]
    assert len(status_updates) == 1
    assert status_updates[0][0][1] == "REJECTED"
    assert status_updates[0][0][2]["retcode"] == "MISSING_TRADE_ID"
    assert broker_calls == []
    assert service.last_error == "LIVE EXIT requires trade_id"

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
