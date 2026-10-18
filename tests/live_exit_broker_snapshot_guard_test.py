import asyncio
from types import SimpleNamespace

import pytest

from src.services import execution_service as execution_module
from src.services.execution_service import ExecutionService


def _raise_snapshot_error():
    raise RuntimeError("mock snapshot failure")


@pytest.mark.parametrize(
    ("snapshot_kind", "expected_retcode"),
    [
        ("exception", "BROKER_POSITION_SNAPSHOT_FAILED"),
        ("not_dict", "BROKER_POSITION_SNAPSHOT_INVALID"),
        ("unsuccessful", "BROKER_POSITION_SNAPSHOT_FAILED"),
        ("invalid_positions", "BROKER_POSITION_SNAPSHOT_INVALID"),
        ("ticket_missing", "BROKER_POSITION_NOT_FOUND"),
        ("symbol_mismatch", "BROKER_POSITION_SYMBOL_MISMATCH"),
        ("side_mismatch", "BROKER_POSITION_SIDE_MISMATCH"),
    ],
)
def test_live_exit_rejects_invalid_broker_snapshot_before_transmission(
    monkeypatch, snapshot_kind, expected_retcode
):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "LIVE"
    monkeypatch.setattr(
        service,
        "_verify_broker_account_mode",
        lambda expected_mode: {"ok": True, "code": "MOCK_ACCOUNT_VERIFIED"},
    )
    service.orders_rejected = 0
    service.orders_sent = 0
    service.orders_filled = 0
    service.last_order_time = None
    service.last_fill_time = None
    service.last_error = None
    service.execution_latency_ms = 0

    client_order_id = "snapshot-guard-mock-only"
    oms_order_id = "mock-live-exit-order"
    released = []
    status_updates = []
    transmission_calls = []

    async def claim_identity(_client_order_id):
        return True, None

    async def release_identity(value):
        released.append(value)

    async def finalize_identity(*args, **kwargs):
        pytest.fail("Rejected snapshot unexpectedly finalized execution")

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_identity)
    monkeypatch.setattr(service, "_release_execution_idempotency", release_identity)
    monkeypatch.setattr(service, "_finalize_execution_idempotency", finalize_identity)

    monkeypatch.setattr(
        execution_module.oms_service,
        "create_order",
        lambda _request: {"order_id": oms_order_id},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda *args, **kwargs: status_updates.append((args, kwargs)),
    )
    monkeypatch.setattr(
        execution_module.risk_engine_service,
        "approve_order",
        lambda _request: {"approved": True},
    )
    monkeypatch.setattr(
        execution_module.execution_guard_service,
        "evaluate",
        lambda **kwargs: {"allowed": True, "status": "TEST_APPROVED"},
    )
    monkeypatch.setattr(
        execution_module.mt5,
        "order_check",
        lambda _request: SimpleNamespace(retcode=0, comment="mock pass"),
    )

    def forbidden_order_send(_request):
        transmission_calls.append(_request)
        pytest.fail("Rejected LIVE EXIT reached mt5.order_send")

    monkeypatch.setattr(execution_module.mt5, "order_send", forbidden_order_send)

    local_position = {
        "status": "OPEN",
        "symbol": "XAUUSDm",
        "side": "BUY",
        "volume": 0.01,
        "broker_position_ticket": 987654,
    }
    monkeypatch.setattr(
        execution_module.position_service,
        "positions",
        {"mock-trade-id": local_position},
    )
    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_market_state",
        lambda: {"XAUUSDm": {"bid": 2500.0, "ask": 2500.2}},
    )

    valid_broker_position = {
        "ticket": 987654,
        "symbol": "XAUUSDm",
        "type": "BUY",
    }
    snapshots = {
        "not_dict": None,
        "unsuccessful": {
            "success": False,
            "positions": [],
            "error": "mock snapshot failure",
        },
        "invalid_positions": {
            "success": True,
            "positions": None,
        },
        "ticket_missing": {
            "success": True,
            "positions": [],
        },
        "symbol_mismatch": {
            "success": True,
            "positions": [
                {**valid_broker_position, "symbol": "BTCUSDm"}
            ],
        },
        "side_mismatch": {
            "success": True,
            "positions": [
                {**valid_broker_position, "type": "SELL"}
            ],
        },
    }

    if snapshot_kind == "exception":
        snapshot_function = _raise_snapshot_error
    else:
        snapshot_response = snapshots[snapshot_kind]
        snapshot_function = lambda: snapshot_response

    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_positions_for_reconciliation",
        snapshot_function,
    )

    request = {
        "action": "EXIT",
        "type": "EXIT",
        "trade_id": "mock-trade-id",
        "decision_id": "snapshot-guard-test-decision",
        "client_order_id": client_order_id,
        "live_transmission_authorized": True,
        "volume": 0.01,
        "price": 2500.0,
        "symbol": "XAUUSDm",
    }

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == expected_retcode
    assert result.get("broker_transmission_started") is not True
    assert transmission_calls == []
    assert released == [client_order_id]
    assert len(status_updates) == 1
    assert status_updates[0][0][0] == oms_order_id
    assert status_updates[0][0][1] == "REJECTED"



def test_live_exit_valid_broker_snapshot_reaches_mocked_transmission(monkeypatch):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "LIVE"
    monkeypatch.setattr(
        service,
        "_verify_broker_account_mode",
        lambda expected_mode: {"ok": True, "code": "MOCK_ACCOUNT_VERIFIED"},
    )
    service.orders_rejected = 0
    service.orders_sent = 0
    service.orders_filled = 0
    service.last_order_time = None
    service.last_fill_time = None
    service.last_error = None
    service.execution_latency_ms = 0

    client_order_id = "snapshot-guard-positive-mock-only"
    oms_order_id = "mock-live-exit-positive-order"
    released = []
    finalized = []
    status_updates = []
    order_check_calls = []
    transmission_calls = []

    async def claim_identity(_client_order_id):
        return True, None

    async def release_identity(value):
        released.append(value)

    async def finalize_identity(*args, **kwargs):
        finalized.append((args, kwargs))

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_identity)
    monkeypatch.setattr(service, "_release_execution_idempotency", release_identity)
    monkeypatch.setattr(service, "_finalize_execution_idempotency", finalize_identity)

    monkeypatch.setattr(
        execution_module.oms_service,
        "create_order",
        lambda _request: {"order_id": oms_order_id},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda *args, **kwargs: status_updates.append((args, kwargs)),
    )
    monkeypatch.setattr(
        execution_module.risk_engine_service,
        "approve_order",
        lambda _request: {"approved": True},
    )
    monkeypatch.setattr(
        execution_module.execution_guard_service,
        "evaluate",
        lambda **kwargs: {"allowed": True, "status": "TEST_APPROVED"},
    )

    def mock_order_check(request):
        order_check_calls.append(dict(request))
        return SimpleNamespace(retcode=0, comment="mock check passed")

    monkeypatch.setattr(execution_module.mt5, "order_check", mock_order_check)

    mock_rejection_retcode = 987654
    assert mock_rejection_retcode != execution_module.mt5.TRADE_RETCODE_DONE

    def mock_order_send(request):
        transmission_calls.append(dict(request))
        return SimpleNamespace(
            retcode=mock_rejection_retcode,
            comment="controlled mock rejection; no broker connection",
        )

    monkeypatch.setattr(execution_module.mt5, "order_send", mock_order_send)

    local_position = {
        "status": "OPEN",
        "symbol": "XAUUSDm",
        "side": "BUY",
        "volume": 0.01,
        "broker_position_ticket": 987654,
    }
    monkeypatch.setattr(
        execution_module.position_service,
        "positions",
        {"mock-trade-id": local_position},
    )
    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_market_state",
        lambda: {"XAUUSDm": {"bid": 2500.0, "ask": 2500.2}},
    )
    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_positions_for_reconciliation",
        lambda: {
            "success": True,
            "positions": [
                {
                    "ticket": 987654,
                    "symbol": "XAUUSDm",
                    "type": "BUY",
                }
            ],
        },
    )

    request = {
        "action": "EXIT",
        "type": "EXIT",
        "trade_id": "mock-trade-id",
        "decision_id": "snapshot-guard-positive-test-decision",
        "client_order_id": client_order_id,
        "live_transmission_authorized": True,
        "volume": 0.01,
        "price": 2500.0,
        "symbol": "XAUUSDm",
    }

    result = asyncio.run(service.send_order(request))

    assert result["success"] is False
    assert result["retcode"] == mock_rejection_retcode
    assert len(order_check_calls) == 1
    assert len(transmission_calls) == 1

    transmitted_request = transmission_calls[0]
    assert transmitted_request["symbol"] == "XAUUSDm"
    assert transmitted_request["position"] == 987654
    assert transmitted_request["type"] == execution_module.mt5.ORDER_TYPE_SELL
    assert transmitted_request["price"] == 2500.0
    assert transmitted_request["volume"] == 0.01

    assert service.orders_sent == 1
    assert service.orders_filled == 0
    assert service.orders_rejected == 1
    assert released == []
    assert len(finalized) == 1
    assert finalized[0][0][0] == client_order_id
    assert finalized[0][0][1]["retcode"] == mock_rejection_retcode
    assert not any(
        args and args[1] in ("FILLED", "CLOSED")
        for args, _kwargs in status_updates
    )
