from __future__ import annotations

from typing import Any, Dict

from .trading_state import TradingStateContract


def _float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


def _bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default

    if isinstance(value, bool):
        return value

    if isinstance(value, str):
        return value.strip().lower() in {
            "true",
            "1",
            "yes",
            "warning",
            "warn",
            "blocked",
        }

    return bool(value)


def build_trading_state_contract(
    state: Dict[str, Any],
) -> TradingStateContract:
    """
    Convert the authoritative GlobalTradingStateService snapshot
    into the canonical external trading-state contract.

    No trading calculations are performed here.
    No state is mutated here.

    Legacy single-symbol aliases are preserved while authoritative
    multi-symbol collections are exposed unchanged.
    """

    account = state.get("account") or {}
    portfolio = state.get("portfolio") or {}
    risk = state.get("risk") or {}
    statistics = state.get("statistics") or {}
    positions = state.get("positions") or []

    balance = _float(
        portfolio.get(
            "balance",
            account.get("balance", 0.0),
        )
    )

    equity = _float(
        portfolio.get(
            "equity",
            account.get("equity", balance),
        )
    )

    floating_pl = _float(
        portfolio.get("floating_pl", 0.0)
    )

    current_drawdown = _float(
        risk.get("current_drawdown", 0.0)
    )

    max_drawdown = _float(
        risk.get(
            "maximum_allowed_drawdown",
            risk.get("max_daily_drawdown", 0.0),
        )
    )

    risk_status = str(
        risk.get("status", "UNKNOWN")
    )

    liquidation_warning = _bool(
        risk.get("liquidation_warning", False)
    )

    total_trades = _int(
        statistics.get(
            "trade_count",
            statistics.get("total_trades", 0),
        )
    )

    value_at_risk = _float(
        risk.get(
            "value_at_risk",
            statistics.get("value_at_risk", 0.0),
        )
    )

    hedging_signals = (
        risk.get("hedging_signals")
        if "hedging_signals" in risk
        else []
    )

    return TradingStateContract(
        timestamp=_float(state.get("timestamp")),

        balance=balance,
        equity=equity,
        floatingPl=_float(floating_pl),

        currentDrawdown=current_drawdown,
        maxDrawdown=max_drawdown,

        winRate=_float(
            statistics.get("win_rate", 0.0)
        ),

        profitFactor=_float(
            statistics.get("profit_factor", 0.0)
        ),

        expectancy=_float(
            statistics.get("expectancy", 0.0)
        ),

        sharpeRatio=_float(
            statistics.get("sharpe_ratio", 0.0)
        ),

        totalTrades=total_trades,

        positions=positions,

        riskPerTrade=_float(
            risk.get("risk_per_trade", 0.0)
        ),

        marginUsage=_float(
            risk.get("margin_usage", 0.0)
        ),

        liquidationWarning=liquidation_warning,

        portfolioValue=equity,

        netExposure=_float(
            portfolio.get(
                "exposure",
                risk.get("exposure", 0.0),
            )
        ),

        valueAtRisk=value_at_risk,

        riskStatus=risk_status,

        hedgingSignals=hedging_signals,

        # Global infrastructure.
        account=account,
        market=state.get("market") or {},
        venue_context=state.get("venue_context") or {},

        # Legacy single-symbol aliases.
        market_features=state.get("market_features"),
        market_regime=state.get("market_regime"),
        trend=state.get("trend"),
        counter_trend_execution=state.get(
            "counter_trend_execution"
        ),
        ai_decision=state.get("ai_decision"),
        execution_decision=state.get("execution_decision"),
        ai_execution=state.get("ai_execution"),
        execution_risk=state.get("execution_risk"),
        order_builder=state.get("order_builder"),
        ai_execution_orchestrator=state.get(
            "ai_execution_orchestrator"
        ),

        # Authoritative multi-symbol state.
        symbols=state.get("symbols") or [],
        symbol_states=state.get("symbol_states") or {},
        market_features_by_symbol=(
            state.get("market_features_by_symbol") or {}
        ),
        cross_market_analytics=(
            state.get("cross_market_analytics") or {}
        ),
        market_regime_by_symbol=(
            state.get("market_regime_by_symbol") or {}
        ),
        trend_by_symbol=(
            state.get("trend_by_symbol") or {}
        ),
        counter_trend_by_symbol=(
            state.get("counter_trend_by_symbol") or {}
        ),
        ai_decision_by_symbol=(
            state.get("ai_decision_by_symbol") or {}
        ),
        execution_decision_by_symbol=(
            state.get("execution_decision_by_symbol") or {}
        ),
        ai_execution_by_symbol=(
            state.get("ai_execution_by_symbol") or {}
        ),
        execution_risk_by_symbol=(
            state.get("execution_risk_by_symbol") or {}
        ),
        order_builder_by_symbol=(
            state.get("order_builder_by_symbol") or {}
        ),
        ai_execution_orchestrator_by_symbol=(
            state.get("ai_execution_orchestrator_by_symbol") or {}
        ),

        # Global infrastructure.
        execution_queue=state.get("execution_queue"),
        vault=state.get("vault") or {},
        portfolio=portfolio,
        risk=risk,
        execution=state.get("execution"),
        oms=state.get("oms"),
        statistics=statistics,
        financial_intelligence=(
            state.get("financial_intelligence") or {}
        ),
    )
