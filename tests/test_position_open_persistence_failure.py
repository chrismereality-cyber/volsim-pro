import asyncio
from copy import deepcopy

import pytest

from src.services.position_service import PositionService


def test_open_position_persistence_failure_does_not_register_position(monkeypatch):
    service = PositionService()

    async def fail_persistence(position):
        raise RuntimeError("simulated position persistence failure")

    monkeypatch.setattr(service, "persist_snapshot", fail_persistence)

    order = {
        "symbol": "XAUUSDm",
        "type": "BUY",
        "volume": 0.01,
        "stop_loss": 2490.0,
        "take_profit": 2520.0,
        "price": 2500.0,
    }

    execution = {
        "oms_order_id": "TEST-OMS-OPEN-FAILURE",
        "price": 2500.0,
        "order_ticket": 101,
        "deal_ticket": 102,
        "position_ticket": 103,
    }

    with pytest.raises(
        RuntimeError,
        match="simulated position persistence failure",
    ):
        asyncio.run(
            service.open_position(
                "TEST-POSITION-OPEN-FAILURE",
                order,
                execution,
            )
        )

    assert "TEST-POSITION-OPEN-FAILURE" not in service.positions


def test_persist_snapshot_rolls_back_when_history_insert_fails(monkeypatch):
    from contextlib import asynccontextmanager

    import src.services.position_service as position_module

    service = PositionService()
    calls = []
    transaction_state = {"committed": False, "rolled_back": False}

    class FakeConnection:
        async def execute(self, query, *args):
            if "INSERT INTO positions" in query:
                calls.append("position")
                return "INSERT 0 1"

            if "INSERT INTO position_snapshots" in query:
                calls.append("snapshot")
                raise RuntimeError("simulated snapshot insert failure")

            raise AssertionError("Unexpected SQL statement")

    @asynccontextmanager
    async def fake_transaction():
        try:
            yield FakeConnection()
        except BaseException:
            transaction_state["rolled_back"] = True
            raise
        else:
            transaction_state["committed"] = True

    monkeypatch.setattr(
        position_module.database_service,
        "transaction",
        fake_transaction,
    )

    position = {
        "trade_id": "TEST-ATOMIC-POSITION",
        "oms_order_id": "TEST-ATOMIC-OMS",
        "symbol": "XAUUSDm",
        "side": "BUY",
        "volume": 0.01,
        "open_price": 2500.0,
        "current_price": 2500.0,
        "floating_pl": 0.0,
        "realized_pl": 0.0,
        "status": "OPEN",
        "opened_at": 1_800_000_000.0,
        "closed_at": None,
        "close_price": None,
    }

    with pytest.raises(
        RuntimeError,
        match="simulated snapshot insert failure",
    ):
        asyncio.run(service.persist_snapshot(position))

    assert calls == ["position", "snapshot"]
    assert transaction_state["rolled_back"] is True
    assert transaction_state["committed"] is False


def test_broker_close_oms_update_failure_is_reported_as_discrepancy(monkeypatch):
    import src.services.position_service as position_module

    service = PositionService()
    oms_order_id = "TEST-OMS-CLOSE-REGRESSION"
    original_position = {
        "oms_order_id": oms_order_id,
        "trade_id": "987654",
        "broker_order_ticket": None,
        "broker_deal_ticket": None,
        "broker_position_ticket": 987654,
        "symbol": "XAUUSDm",
        "side": "BUY",
        "volume": 0.01,
        "open_price": 3390.0,
        "current_price": 3395.0,
        "floating_pl": 5.0,
        "realized_pl": 0.0,
        "status": "OPEN",
        "opened_at": 1756799000,
        "closed_at": None,
        "close_price": None,
    }
    service.positions["987654"] = deepcopy(original_position)

    original_oms_order = {
        "order_id": oms_order_id,
        "status": "FILLED",
        "execution_result": {"success": True, "price": 3390.0},
        "closed_at": None,
        "close_price": None,
        "profit": 0.0,
        "updated_at": 1756799000,
    }
    position_module.oms_service.orders[oms_order_id] = deepcopy(
        original_oms_order
    )

    monkeypatch.setattr(
        position_module.mt5_service,
        "get_positions_for_reconciliation",
        lambda: {"success": True, "positions": [], "error": None},
    )
    monkeypatch.setattr(
        position_module.mt5_service,
        "get_position_close_deals",
        lambda ticket: {
            "success": True,
            "position_ticket": ticket,
            "deals": [{
                "position_id": ticket,
                "price": 3410.0,
                "time": 1756800100,
                "ticket": 987655,
                "order": 987656,
                "profit": 20.0,
                "swap": 0.0,
                "commission": 0.0,
            }],
            "error": None,
        },
    )
    async def no_op_persist_snapshot(position):
        return None

    monkeypatch.setattr(
        service, "persist_snapshot", no_op_persist_snapshot
    )

    def fail_oms_update(*args, **kwargs):
        raise RuntimeError("simulated OMS close update failure")

    monkeypatch.setattr(
        position_module.oms_service,
        "update_status",
        fail_oms_update,
    )

    try:
        result = asyncio.run(service.sync_from_mt5())

        assert result["status"] == "RECONCILED_WITH_DISCREPANCIES"
        assert service.positions["987654"]["status"] == "CLOSED"
        assert result["discrepancies"], (
            "OMS bridge failure must be visible in reconciliation output"
        )
        assert any(
            "OMS" in str(discrepancy).upper()
            or "oms" in str(discrepancy).lower()
            for discrepancy in result["discrepancies"]
        )
        assert (
            position_module.oms_service.orders[oms_order_id]
            == original_oms_order
        )
    finally:
        position_module.oms_service.orders.pop(oms_order_id, None)
def test_open_position_cancellation_does_not_register_position():
    service = PositionService()

    async def cancel_persistence(position):
        raise asyncio.CancelledError()

    service.persist_snapshot = cancel_persistence

    order = {
        "symbol": "XAUUSDm",
        "type": "BUY",
        "volume": 0.01,
        "stop_loss": 2490.0,
        "take_profit": 2520.0,
        "price": 2500.0,
    }

    execution = {
        "oms_order_id": "TEST-OMS-OPEN-CANCEL",
        "price": 2500.0,
        "order_ticket": 201,
        "deal_ticket": 202,
        "position_ticket": 203,
    }

    with pytest.raises(asyncio.CancelledError):
        asyncio.run(
            service.open_position(
                "TEST-POSITION-OPEN-CANCEL",
                order,
                execution,
            )
        )

    assert "TEST-POSITION-OPEN-CANCEL" not in service.positions