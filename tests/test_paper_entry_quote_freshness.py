import time

import pytest

import src.services.execution_service as execution_module
from src.services.execution_service import ExecutionService


def make_paper_entry_service(monkeypatch, action, quote):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_sent = 0
    service.orders_filled = 0
    service.orders_rejected = 0
    service.last_order_time = None
    service.last_fill_time = None
    service.execution_latency_ms = 0
    service.last_error = None

    state = {
        "opened": [],
        "statuses": [],
        "finalized": [],
        "released": [],
    }

    async def claim(client_order_id):
        return True, None

    async def finalize(client_order_id, result, order_id):
        state["finalized"].append((client_order_id, result, order_id))

    async def release(client_order_id):
        state["released"].append(client_order_id)

    async def open_position(trade_id, request, result):
        position = {
            "trade_id": trade_id,
            "symbol": request["symbol"],
            "side": action,
            "status": "OPEN",
            "entry_price": result["price"],
        }
        state["opened"].append(position)
        return position

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim)
    monkeypatch.setattr(service, "_finalize_execution_idempotency", finalize)
    monkeypatch.setattr(service, "_release_execution_idempotency", release)
    monkeypatch.setattr(
        service,
        "_record_entry_attribution",
        lambda *args, **kwargs: _async_true(),
    )

    monkeypatch.setattr(
        execution_module.oms_service,
        "create_order",
        lambda request: {"order_id": "TEST-PAPER-ENTRY-OMS"},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda order_id, status, result=None: state["statuses"].append(
            (order_id, status, result)
        ),
    )
    monkeypatch.setattr(
        execution_module.risk_engine_service,
        "approve_order",
        lambda request: {"approved": True, "reason": "TEST_ONLY_APPROVAL"},
    )
    monkeypatch.setattr(
        execution_module.execution_guard_service,
        "evaluate",
        lambda **kwargs: {
            "allowed": True,
            "status": "TEST_APPROVED",
            "reason": "TEST_ONLY_APPROVAL",
        },
    )
    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_market_state",
        lambda: {"XAUUSDm": quote},
    )

    monkeypatch.setattr(
        execution_module,
        "position_service",
        type(
            "FakePositionService",
            (),
            {"open_position": staticmethod(open_position)},
        )(),
    )

    request = {
        "action": action,
        "type": action,
        "decision_id": "TEST-AI-DECISION-" + action,
        "client_order_id": "TEST-PAPER-ENTRY-" + action,
        "volume": 0.01,
        "price": 2500.0,
        "stop_loss": 2490.0 if action == "BUY" else 2510.0,
        "symbol": "XAUUSDm",
        "strategy_signal": action,
    }

    return service, request, state


async def _async_true():
    return True


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("action", "expected_price"),
    [("BUY", 2501.0), ("SELL", 2499.0)],
)
async def test_paper_entry_uses_executable_side_of_fresh_quote(
    monkeypatch, action, expected_price
):
    quote = {
        "bid": 2499.0,
        "ask": 2501.0,
        "timestamp": time.time(),
    }
    service, request, state = make_paper_entry_service(
        monkeypatch, action, quote
    )

    result = await service.send_order(request)

    assert result["success"] is True
    assert result["retcode"] == "SIMULATED_FILL"
    assert result["price"] == expected_price
    assert service.orders_filled == 1
    assert service.orders_sent == 1
    assert len(state["opened"]) == 1
    assert state["opened"][0]["entry_price"] == expected_price
    assert state["finalized"]


@pytest.mark.asyncio
async def test_paper_entry_rejects_stale_quote_before_simulated_fill(
    monkeypatch,
):
    quote = {
        "bid": 2499.0,
        "ask": 2501.0,
        "timestamp": time.time() - 60,
    }
    service, request, state = make_paper_entry_service(
        monkeypatch, "BUY", quote
    )

    result = await service.send_order(request)

    assert result["success"] is False
    assert result["retcode"] == "PAPER_QUOTE_STALE"
    assert service.orders_filled == 0
    assert service.orders_sent == 0
    assert state["opened"] == []
    assert state["released"] == [request["client_order_id"]]
    assert state["statuses"][-1][1] == "REJECTED"

@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("action", "invalid_stop"),
    [
        ("BUY", 2501.0),
        ("SELL", 2499.0),
        ("BUY", 0.0),
        ("BUY", float("nan")),
    ],
)
async def test_paper_entry_rejects_invalid_stop_before_simulated_fill(
    monkeypatch, action, invalid_stop
):
    quote = {
        "bid": 2499.0,
        "ask": 2501.0,
        "timestamp": time.time(),
    }
    service, request, state = make_paper_entry_service(
        monkeypatch, action, quote
    )
    request["stop_loss"] = invalid_stop

    result = await service.send_order(request)

    assert result["success"] is False
    expected_retcode = (
        "INVALID_PROTECTIVE_STOP_DIRECTION"
        if invalid_stop in (2501.0, 2499.0)
        else "INVALID_PROTECTIVE_STOP"
    )
    assert result["retcode"] == expected_retcode
    assert service.orders_filled == 0
    assert service.orders_sent == 0
    assert service.orders_rejected == 1
    assert state["opened"] == []
    assert state["finalized"] == []
    assert state["released"] == [request["client_order_id"]]
    assert state["statuses"] == []  # Early stop validation precedes OMS order creation.


@pytest.mark.asyncio
async def test_paper_entry_stale_quote_release_failure_requires_reconciliation(
    monkeypatch,
):
    quote = {
        "bid": 2499.0,
        "ask": 2501.0,
        "timestamp": time.time() - 60,
    }
    service, request, state = make_paper_entry_service(
        monkeypatch, "BUY", quote
    )

    async def fail_release(client_order_id):
        raise RuntimeError("test-only idempotency release failure")

    monkeypatch.setattr(service, "_release_execution_idempotency", fail_release)

    result = await service.send_order(request)

    assert result["success"] is False
    assert result["retcode"] == "EXECUTION_STATE_UNRESOLVED"
    assert result["retryable"] is False
    assert result["reconciliation_required"] is True
    assert result["broker_transmission_started"] is False
    assert service.orders_filled == 0
    assert service.orders_sent == 0
    assert state["opened"] == []
    assert state["finalized"] == []
    assert state["statuses"][-1][1] == "REJECTED"
    assert state["statuses"][-1][2]["retcode"] == "EXECUTION_STATE_UNRESOLVED"
