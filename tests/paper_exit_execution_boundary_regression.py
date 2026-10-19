import pytest
import time

import src.services.execution_service as execution_module
from src.services.execution_service import ExecutionService


@pytest.mark.asyncio
async def test_paper_exit_closes_existing_open_position(monkeypatch):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_rejected = 0
    service.orders_sent = 0
    service.orders_filled = 0
    service.last_error = None

    trade_id = "TEST-PAPER-EXIT-BOUNDARY"
    order_id = "TEST-OMS-PAPER-EXIT"
    closed = {}

    position = {
        "trade_id": trade_id,
        "symbol": "XAUUSDm",
        "side": "BUY",
        "volume": 0.01,
        "status": "OPEN",
        "entry_price": 4000.0,
    }

    class FakePositionService:
        positions = {trade_id: position}

        async def close_position(self, requested_trade_id, close_price):
            closed["trade_id"] = requested_trade_id
            closed["close_price"] = close_price
            result = {
                **position,
                "status": "CLOSED",
                "exit_price": close_price,
                "realized_pl": 5.0,
            }
            self.positions[trade_id] = result
            return result

    position_service = FakePositionService()

    monkeypatch.setattr(execution_module, "position_service", position_service)

    async def claim_execution_identity(client_order_id):
        return (True, None)

    async def no_op_async(*args, **kwargs):
        return None

    monkeypatch.setattr(service, "_claim_execution_idempotency", claim_execution_identity)
    monkeypatch.setattr(service, "_finalize_execution_idempotency", no_op_async)
    monkeypatch.setattr(service, "_release_execution_idempotency", no_op_async)
    monkeypatch.setattr(service, "record_trade_ledger", no_op_async)
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
        execution_module.oms_service,
        "create_order",
        lambda request: {"order_id": order_id},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda *args, **kwargs: None,
    )
    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_market_state",
        lambda: {
            "XAUUSDm": {
                "bid": 4010.5,
                "ask": 4011.0,
                "timestamp": time.time(),
            }
        },
    )


    request = {
        "type": "EXIT",
        "symbol": "XAUUSDm",
        "volume": 0.01,
        "trade_id": trade_id,
        "position_side": "BUY",
        "decision_id": "TEST-DECISION-PAPER-EXIT",
        "client_order_id": "TEST-CLIENT-PAPER-EXIT",
        "comment": "VolSim-Pro AI Exit",
    }

    result = await service.send_order(request)

    assert result["retcode"] == "SIMULATED_EXIT"
    assert result["trade_id"] == trade_id
    assert result["symbol"] == "XAUUSDm"
    assert result["side"] == "BUY"
    assert result["price"] == 4010.5
    assert result["position"]["status"] == "CLOSED"
    assert closed == {
        "trade_id": trade_id,
        "close_price": 4010.5,
    }


@pytest.mark.asyncio
async def test_paper_exit_stale_quote_release_failure_keeps_position_open(
    monkeypatch,
):
    service = ExecutionService.__new__(ExecutionService)
    service.execution_mode = "PAPER"
    service.orders_rejected = 0
    service.orders_sent = 0
    service.orders_filled = 0
    service.last_error = None

    trade_id = "TEST-PAPER-EXIT-STALE-RELEASE-FAILURE"
    order_id = "TEST-OMS-PAPER-EXIT-STALE"
    position = {
        "trade_id": trade_id,
        "symbol": "XAUUSDm",
        "side": "BUY",
        "volume": 0.01,
        "status": "OPEN",
        "entry_price": 4000.0,
    }
    status_updates = []
    close_calls = []

    class FakePositionService:
        positions = {trade_id: position}

        async def close_position(self, requested_trade_id, close_price):
            close_calls.append((requested_trade_id, close_price))
            raise AssertionError("Stale quote must not close a PAPER position")

    monkeypatch.setattr(
        execution_module, "position_service", FakePositionService()
    )

    async def claim_execution_identity(client_order_id):
        return True, None

    async def no_op_async(*args, **kwargs):
        return None

    async def fail_release(client_order_id):
        raise RuntimeError("test-only idempotency release failure")

    monkeypatch.setattr(
        service, "_claim_execution_idempotency", claim_execution_identity
    )
    monkeypatch.setattr(
        service, "_finalize_execution_idempotency", no_op_async
    )
    monkeypatch.setattr(
        service, "_release_execution_idempotency", fail_release
    )
    monkeypatch.setattr(service, "record_trade_ledger", no_op_async)
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
        execution_module.oms_service,
        "create_order",
        lambda request: {"order_id": order_id},
    )
    monkeypatch.setattr(
        execution_module.oms_service,
        "update_status",
        lambda *args, **kwargs: status_updates.append((args, kwargs)),
    )
    monkeypatch.setattr(
        execution_module.mt5_service,
        "get_market_state",
        lambda: {
            "XAUUSDm": {
                "bid": 4010.5,
                "ask": 4011.0,
                "timestamp": time.time() - 60,
            }
        },
    )

    request = {
        "type": "EXIT",
        "symbol": "XAUUSDm",
        "volume": 0.01,
        "trade_id": trade_id,
        "position_side": "BUY",
        "decision_id": "TEST-DECISION-PAPER-EXIT-STALE",
        "client_order_id": "TEST-CLIENT-PAPER-EXIT-STALE",
        "comment": "VolSim-Pro AI Exit",
    }

    result = await service.send_order(request)

    assert result["success"] is False
    assert result["retcode"] == "EXECUTION_STATE_UNRESOLVED"
    assert result["retryable"] is False
    assert result["reconciliation_required"] is True
    assert close_calls == []
    assert position["status"] == "OPEN"
    assert service.orders_filled == 0
    assert service.orders_sent == 0
    assert status_updates[-1][0][1] == "REJECTED"
    assert status_updates[-1][0][2]["retcode"] == "EXECUTION_STATE_UNRESOLVED"
