import math

import pytest

from src.services.risk_service import RiskEngineService


VALID_POLICY = {
    "max_daily_drawdown_percent": 5.0,
    "risk_per_trade_percent": 1.0,
    "max_position_size": 2.0,
    "liquidation_drawdown_percent": 10.0,
    "liquidation_margin_usage_percent": 80.0,
}

VALID_PORTFOLIO = {
    "balance": 1000.0,
    "equity": 1000.0,
    "margin": 0.0,
    "exposure": 0.0,
}


def make_service():
    service = RiskEngineService()
    service._risk_policy = dict(VALID_POLICY)
    service._risk_policy_ready = True
    return service


@pytest.mark.parametrize(
    "portfolio",
    [
        {"equity": 1000.0, "margin": 0.0, "exposure": 0.0},
        {**VALID_PORTFOLIO, "balance": None},
        {**VALID_PORTFOLIO, "equity": "not-a-number"},
        {**VALID_PORTFOLIO, "balance": math.nan},
        {**VALID_PORTFOLIO, "equity": math.inf},
        {**VALID_PORTFOLIO, "margin": -1.0},
        {**VALID_PORTFOLIO, "exposure": -1.0},
        {**VALID_PORTFOLIO, "balance": 0.0},
        {**VALID_PORTFOLIO, "equity": 0.0},
    ],
)
def test_snapshot_fails_closed_for_invalid_portfolio(portfolio):
    service = make_service()

    state = service.snapshot(portfolio)

    assert state["status"] == "ERROR"
    assert state["balance"] is None
    assert state["equity"] is None
    assert state["current_drawdown"] is None
    assert state["margin_usage"] is None


@pytest.mark.parametrize(
    "field,value",
    [
        ("risk_per_trade_percent", math.nan),
        ("max_daily_drawdown_percent", math.inf),
        ("max_position_size", 0.0),
    ],
)
def test_snapshot_fails_closed_for_invalid_policy(field, value):
    service = make_service()
    service._risk_policy[field] = value

    state = service.snapshot(VALID_PORTFOLIO)

    assert state["status"] == "ERROR"
    assert state["risk_per_trade_amount"] is None


def test_entry_is_rejected_when_snapshot_is_invalid(monkeypatch):
    service = make_service()
    monkeypatch.setattr(
        service,
        "_portfolio_snapshot",
        lambda: {"equity": 1000.0},
    )

    result = service.approve_order({
        "symbol": "XAUUSDm",
        "type": "BUY",
        "volume": 0.01,
        "price": 2000.0,
        "stop_loss": 1990.0,
    })

    assert result["approved"] is False
    assert "snapshot unavailable" in result["reason"].lower()
    assert result["risk"]["status"] == "ERROR"


def test_exact_exit_keeps_existing_downstream_validation(monkeypatch):
    service = make_service()
    monkeypatch.setattr(
        service,
        "_portfolio_snapshot",
        lambda: {"equity": 1000.0},
    )
    monkeypatch.setattr(
        service,
        "_symbol_contract",
        lambda symbol: {
            "volume_min": 0.01,
            "volume_max": 100.0,
            "volume_step": 0.01,
        },
    )

    result = service.approve_order({
        "symbol": "XAUUSDm",
        "type": "EXIT",
        "volume": 0.01,
    })

    # This verifies only the risk-service boundary. Broker position,
    # ticket, price, order-check and reconciliation checks remain in
    # the execution service and are not bypassed by this test.
    assert result["approved"] is True
    assert result["risk"]["status"] == "ERROR"


@pytest.mark.parametrize(
    "field,value",
    [
        ("risk_per_trade_percent", 6.0),
        ("liquidation_drawdown_percent", 4.0),
    ],
)
def test_snapshot_fails_closed_for_invalid_policy_relationships(field, value):
    service = make_service()
    service._risk_policy[field] = value

    state = service.snapshot(VALID_PORTFOLIO)

    assert state["status"] == "ERROR"
    assert state["risk_per_trade_amount"] is None


def _finite_guard_service(monkeypatch, contract=None, risk_budget=100.0):
    service = make_service()

    monkeypatch.setattr(
        service,
        "snapshot",
        lambda: {
            "status": "OK",
            "circuit_breaker_active": False,
            "liquidation_warning": False,
            "risk_per_trade_amount": risk_budget,
        },
    )
    monkeypatch.setattr(
        service,
        "_symbol_contract",
        lambda symbol: {
            "volume_min": 0.01,
            "volume_max": 100.0,
            "volume_step": 0.01,
            "trade_tick_size": 0.01,
            "trade_tick_value": 1.0,
            **(contract or {}),
        },
    )

    return service


def _valid_entry_request(**overrides):
    request = {
        "symbol": "XAUUSDm",
        "type": "BUY",
        "volume": 0.01,
        "price": 2000.0,
        "stop_loss": 1990.0,
    }
    request.update(overrides)
    return request


@pytest.mark.parametrize("volume", [math.nan, math.inf, -math.inf])
def test_approve_order_rejects_non_finite_volume(monkeypatch, volume):
    service = _finite_guard_service(monkeypatch)

    result = service.approve_order(_valid_entry_request(volume=volume))

    assert result["approved"] is False
    assert result["reason"] == "Volume must be finite"


@pytest.mark.parametrize(
    "field",
    ["volume_min", "volume_max", "volume_step"],
)
@pytest.mark.parametrize("value", [math.nan, math.inf, -math.inf])
def test_approve_order_rejects_non_finite_broker_volume_contract(
    monkeypatch, field, value
):
    service = _finite_guard_service(monkeypatch, contract={field: value})

    result = service.approve_order(_valid_entry_request())

    assert result["approved"] is False
    assert result["reason"] == "Broker volume contract contains non-finite values"


@pytest.mark.parametrize("price", [math.nan, math.inf, -math.inf])
def test_approve_order_rejects_non_finite_entry_price(monkeypatch, price):
    service = _finite_guard_service(monkeypatch)

    result = service.approve_order(_valid_entry_request(price=price))

    assert result["approved"] is False
    assert result["reason"] == "Entry price must be finite"


@pytest.mark.parametrize("stop_loss", [math.nan, math.inf, -math.inf])
def test_approve_order_rejects_non_finite_protective_stop(monkeypatch, stop_loss):
    service = _finite_guard_service(monkeypatch)

    result = service.approve_order(_valid_entry_request(stop_loss=stop_loss))

    assert result["approved"] is False
    assert result["reason"] == "Protective stop must be finite"


@pytest.mark.parametrize(
    ("field", "reason"),
    [
        ("trade_tick_size", "Broker tick size must be finite"),
        ("trade_tick_value", "Broker tick value must be finite"),
    ],
)
@pytest.mark.parametrize("value", [math.nan, math.inf, -math.inf])
def test_approve_order_rejects_non_finite_broker_tick_economics(
    monkeypatch, field, reason, value
):
    service = _finite_guard_service(monkeypatch, contract={field: value})

    result = service.approve_order(_valid_entry_request())

    assert result["approved"] is False
    assert result["reason"] == reason


@pytest.mark.parametrize("risk_budget", [math.nan, math.inf, -math.inf])
def test_approve_order_rejects_non_finite_risk_budget(monkeypatch, risk_budget):
    service = _finite_guard_service(monkeypatch, risk_budget=risk_budget)

    result = service.approve_order(_valid_entry_request())

    assert result["approved"] is False
    assert result["reason"] == "Risk-per-trade budget must be finite"


def test_approve_order_rejects_non_finite_calculated_risk(monkeypatch):
    service = _finite_guard_service(monkeypatch)

    result = service.approve_order(
        _valid_entry_request(
            price=1e308,
            stop_loss=1.0,
        )
    )

    assert result["approved"] is False
    assert result["reason"] == "Risk calculation produced a non-finite value"
