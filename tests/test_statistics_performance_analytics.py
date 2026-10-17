from types import SimpleNamespace

import pytest

from src.services.statistics_service import StatisticsService


def make_service(trades):
    service = StatisticsService.__new__(StatisticsService)
    service._durable_closed_trades = []
    service.oms = SimpleNamespace(
        snapshot=lambda: {"orders": trades}
    )
    return service


def test_performance_analytics_calculates_core_metrics():
    service = make_service([
        {
            "status": "CLOSED",
            "order_id": "A",
            "symbol": "XAUUSDm",
            "volume": 0.01,
            "profit": 100.0,
            "closed_at": 1000.0,
        },
        {
            "status": "CLOSED",
            "order_id": "B",
            "symbol": "XAUUSDm",
            "volume": 0.02,
            "profit": -40.0,
            "closed_at": 2000.0,
        },
        {
            "status": "CLOSED",
            "order_id": "C",
            "symbol": "BTCUSDm",
            "volume": 0.03,
            "profit": 20.0,
            "closed_at": 3000.0,
        },
    ])

    result = service.performance_analytics("ALL")

    assert result["status"] == "success"
    assert result["timeframe"] == "ALL"
    assert result["totalTrades"] == 3
    assert result["winningTrades"] == 2
    assert result["losingTrades"] == 1
    assert result["winRate"] == pytest.approx(200.0 / 3.0)
    assert result["avgWin"] == pytest.approx(60.0)
    assert result["avgLoss"] == pytest.approx(40.0)
    assert result["profitFactor"] == pytest.approx(3.0)
    assert result["expectancy"] == pytest.approx(80.0 / 3.0)
    assert result["maxDrawdown"] == pytest.approx(40.0)
    assert result["maxConsecutiveWins"] == 1
    assert len(result["assetMetrics"]) == 2


def test_performance_analytics_rejects_unsupported_timeframe():
    service = make_service([])

    with pytest.raises(ValueError, match="Unsupported timeframe"):
        service.performance_analytics("7D")


def test_performance_analytics_empty_history_returns_zero_metrics():
    service = make_service([])

    result = service.performance_analytics("ALL")

    assert result["totalTrades"] == 0
    assert result["winRate"] == 0.0
    assert result["profitFactor"] == 0.0
    assert result["expectancy"] == 0.0
    assert result["maxDrawdown"] == 0.0
    assert result["assetMetrics"] == []


def test_merge_deduplicates_live_and_durable_trade_by_trade_id():
    service = make_service([
        {
            "status": "CLOSED",
            "order_id": "ENTRY-1",
            "symbol": "XAUUSDm",
            "side": "BUY",
            "closed_at": 100.0,
            "profit": 0.0,
            "execution_result": {"trade_id": "trade-123"},
        },
        {
            "status": "CLOSED",
            "order_id": "EXIT-1",
            "symbol": "XAUUSDm",
            "side": "SELL",
            "closed_at": 200.0,
            "profit": 25.0,
            "execution_result": {"trade_id": "trade-123"},
        },
    ])

    service._durable_closed_trades = [
        {
            "status": "CLOSED",
            "oms_order_id": "EXIT-1",
            "trade_id": "trade-123",
            "symbol": "XAUUSDm",
            "side": "SELL",
            "closed_at": 200.0,
            "profit": 25.0,
        }
    ]

    merged = service._merged_completed_trades()

    assert len(merged) == 1
    assert merged[0]["profit"] == pytest.approx(25.0)


def test_merge_keeps_distinct_trades_with_distinct_trade_ids():
    service = make_service([
        {
            "status": "CLOSED",
            "order_id": "EXIT-1",
            "symbol": "XAUUSDm",
            "side": "SELL",
            "closed_at": 200.0,
            "profit": 25.0,
            "execution_result": {"trade_id": "trade-123"},
        },
    ])

    service._durable_closed_trades = [
        {
            "status": "CLOSED",
            "oms_order_id": "EXIT-2",
            "trade_id": "trade-456",
            "symbol": "XAUUSDm",
            "side": "SELL",
            "closed_at": 300.0,
            "profit": 15.0,
        }
    ]

    merged = service._merged_completed_trades()

    assert len(merged) == 2
    assert sum(float(item["profit"]) for item in merged) == pytest.approx(40.0)


def test_performance_analytics_filters_30d_90d_and_all_history(monkeypatch):
    now = 2_000_000_000.0
    monkeypatch.setattr("time.time", lambda: now)

    service = make_service([
        {
            "status": "CLOSED",
            "order_id": "RECENT",
            "symbol": "XAUUSDm",
            "profit": 10.0,
            "closed_at": now - (10 * 24 * 60 * 60),
        },
        {
            "status": "CLOSED",
            "order_id": "MID_RANGE",
            "symbol": "XAUUSDm",
            "profit": 20.0,
            "closed_at": now - (45 * 24 * 60 * 60),
        },
        {
            "status": "CLOSED",
            "order_id": "OLD",
            "symbol": "BTCUSDm",
            "profit": 30.0,
            "closed_at": now - (120 * 24 * 60 * 60),
        },
        {
            "status": "CLOSED",
            "order_id": "MISSING_TIMESTAMP",
            "symbol": "BTCUSDm",
            "profit": 40.0,
        },
    ])

    result_30d = service.performance_analytics("30D")
    result_90d = service.performance_analytics("90D")
    result_all = service.performance_analytics("ALL")

    assert result_30d["totalTrades"] == 1
    assert result_30d["expectancy"] == pytest.approx(10.0)

    assert result_90d["totalTrades"] == 2
    assert result_90d["expectancy"] == pytest.approx(15.0)

    assert result_all["totalTrades"] == 4
    assert result_all["expectancy"] == pytest.approx(25.0)
