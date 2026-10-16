import asyncio

from src.services.position_service import PositionService
from src.services import position_service as position_module


async def main():
    service = PositionService()

    original_get = position_module.mt5_service.get_positions_for_reconciliation
    original_persist_position = service.persist_position
    original_persist_snapshot = service.persist_snapshot

    async def fake_persist_position(position):
        pass

    async def fake_persist_snapshot(position):
        pass

    service.persist_position = fake_persist_position
    service.persist_snapshot = fake_persist_snapshot

    try:
        # TEST 1: broker query failure must NOT become zero positions
        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": False,
                "positions": [],
                "error": "TEST_BROKER_QUERY_FAILURE",
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "BROKER_QUERY_FAILED"
        assert result["discrepancies"] == []

        print("TEST 1 - BROKER FAILURE: PASS")

        # TEST 2: successful zero-position snapshot
        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": True,
                "positions": [],
                "error": None,
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "RECONCILED"
        assert result["synchronized"] == []
        assert result["discrepancies"] == []

        print("TEST 2 - SUCCESSFUL ZERO POSITIONS: PASS")

        # TEST 3: broker position import
        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": True,
                "positions": [
                    {
                        "ticket": 987654,
                        "symbol": "XAUUSDm",
                        "type": "BUY",
                        "volume": 0.01,
                        "price_open": 3400.50,
                        "price_current": 3402.25,
                        "profit": 1.75,
                        "swap": 0.0,
                        "magic": 123,
                        "comment": "TEST",
                        "time": 1756800000,
                    }
                ],
                "error": None,
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "RECONCILED"
        assert len(result["synchronized"]) == 1

        position = service.positions["987654"]

        assert position["symbol"] == "XAUUSDm"
        assert position["side"] == "BUY"
        assert position["volume"] == 0.01
        assert position["open_price"] == 3400.50
        assert position["current_price"] == 3402.25
        assert position["floating_pl"] == 1.75
        assert position["status"] == "OPEN"
        assert position["opened_at"] == 1756800000

        print("TEST 3 - BROKER OPEN IMPORT: PASS")

        # TEST 4: local OPEN + broker missing must remain OPEN
        service.positions["LOCAL-OPEN-001"] = {
            "oms_order_id": None,
            "trade_id": "LOCAL-OPEN-001",
            "broker_order_ticket": None,
            "broker_deal_ticket": None,
            "broker_position_ticket": 333,
            "symbol": "XAUUSDm",
            "side": "BUY",
            "volume": 0.01,
            "open_price": 3400.0,
            "current_price": 3401.0,
            "floating_pl": 1.0,
            "realized_pl": 0.0,
            "status": "OPEN",
            "opened_at": 1756800000,
            "closed_at": None,
            "close_price": None,
        }

        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": True,
                "positions": [],
                "error": None,
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "RECONCILED_WITH_DISCREPANCIES"
        assert {item["trade_id"] for item in result["discrepancies"]} == {"987654", "LOCAL-OPEN-001"}

        local_position = service.positions["LOCAL-OPEN-001"]

        assert local_position["status"] == "OPEN"
        assert local_position["closed_at"] is None
        assert local_position["close_price"] is None
        assert local_position["realized_pl"] == 0.0

        print("TEST 4 - LOCAL OPEN / BROKER MISSING: PASS")

        # TEST 5: malformed broker position must fail closed
        service.positions.clear()

        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": True,
                "positions": [
                    {
                        "ticket": None,
                        "symbol": "XAUUSDm",
                        "type": "BUY",
                        "volume": 0.01,
                        "price_open": 3400.0,
                        "price_current": 3400.0,
                        "profit": 0.0,
                        "time": 1756800000,
                    }
                ],
                "error": None,
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "RECONCILIATION_FAILED"
        assert result["synchronized"] == []
        assert result["discrepancies"] == []
        assert service.positions == {}

        print("TEST 5 - MALFORMED BROKER POSITION: PASS")

        print("")
        # TEST 6: reject NaN and infinities in every broker numeric field
        base_position = {
            "ticket": 654321,
            "symbol": "XAUUSDm",
            "type": "BUY",
            "volume": 0.01,
            "price_open": 3400.0,
            "price_current": 3400.0,
            "profit": 0.0,
            "time": 1756800000,
        }

        for field in ("volume", "price_open", "price_current", "profit"):
            for invalid_value in (float("nan"), float("inf"), float("-inf")):
                service.positions.clear()
                malformed_position = base_position.copy()
                malformed_position[field] = invalid_value

                position_module.mt5_service.get_positions_for_reconciliation = (
                    lambda position=malformed_position: {
                        "success": True,
                        "positions": [position],
                        "error": None,
                    }
                )

                result = await service.sync_from_mt5()

                assert result["status"] == "RECONCILIATION_FAILED", (
                    field, invalid_value, result
                )
                assert result["synchronized"] == []
                assert result["discrepancies"] == []
                assert service.positions == {}

        print("TEST 6 - ALL NON-FINITE NUMERIC FIELDS: PASS")

        # TEST 7: malformed later position must not partially import earlier positions
        service.positions.clear()
        valid_position = base_position.copy()
        valid_position["ticket"] = 654322

        malformed_later_position = base_position.copy()
        malformed_later_position["ticket"] = 654323
        malformed_later_position["type"] = "INVALID"

        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": True,
                "positions": [valid_position, malformed_later_position],
                "error": None,
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "RECONCILIATION_FAILED"
        assert result["synchronized"] == []
        assert result["discrepancies"] == []
        assert service.positions == {}

        print("TEST 7 - NO PARTIAL IMPORT ON MALFORMED SNAPSHOT: PASS")
        # TEST 8: duplicate broker tickets must fail before any import
        service.positions.clear()
        duplicate_position_a = base_position.copy()
        duplicate_position_a["ticket"] = 654324
        duplicate_position_b = duplicate_position_a.copy()
        duplicate_position_b["symbol"] = "BTCUSDm"

        position_module.mt5_service.get_positions_for_reconciliation = (
            lambda: {
                "success": True,
                "positions": [duplicate_position_a, duplicate_position_b],
                "error": None,
            }
        )

        result = await service.sync_from_mt5()

        assert result["status"] == "RECONCILIATION_FAILED", result
        assert result["synchronized"] == []
        assert result["discrepancies"] == []
        assert service.positions == {}

        print("TEST 8 - DUPLICATE TICKETS REJECTED: PASS")

        # TEST 9: malformed nonzero timestamps must fail before any import
        for invalid_timestamp in (
            float("nan"),
            float("inf"),
            float("-inf"),
            "not-a-timestamp",
        ):
            service.positions.clear()
            malformed_timestamp_position = base_position.copy()
            malformed_timestamp_position["ticket"] = 654325
            malformed_timestamp_position["time"] = invalid_timestamp

            position_module.mt5_service.get_positions_for_reconciliation = (
                lambda position=malformed_timestamp_position: {
                    "success": True,
                    "positions": [position],
                    "error": None,
                }
            )

            result = await service.sync_from_mt5()

            assert result["status"] == "RECONCILIATION_FAILED", (
                invalid_timestamp, result
            )
            assert result["synchronized"] == []
            assert result["discrepancies"] == []
            assert service.positions == {}

        print("TEST 9 - INVALID TIMESTAMPS REJECTED: PASS")
        print("STAGE 6 HARDENED RECONCILIATION TESTS: ALL PASS")

    finally:
        position_module.mt5_service.get_positions_for_reconciliation = original_get
        service.persist_position = original_persist_position
        service.persist_snapshot = original_persist_snapshot


if __name__ == "__main__":
    asyncio.run(main())
