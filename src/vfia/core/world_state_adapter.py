from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.services.global_trading_state_service import (
    global_trading_state_service,
)

from src.vfia.core.world_state import FinancialWorldState


class VFIAWorldStateAdapter:
    """
    Read-only bridge between VolSim-Pro's authoritative
    GlobalTradingStateService and the VFIA intelligence layer.

    VFIA consumes authoritative VolSim-Pro state.

    VFIA does NOT:
        - connect directly to MT5
        - mutate trading state
        - place broker orders
        - bypass risk governance
        - replace GlobalTradingStateService
    """

    def from_state(
        self,
        state: dict[str, Any],
    ) -> FinancialWorldState:
        """
        Pure transformation of an already-captured
        authoritative VolSim-Pro state.

        This method does not call MT5 or any trading service.
        """

        market = state.get("market") or {}

        instruments: dict[str, Any] = {}

        if isinstance(market, dict):
            for symbol, data in market.items():
                if isinstance(data, dict):
                    instruments[str(symbol)] = {
                        "symbol": data.get(
                            "symbol",
                            symbol,
                        ),
                        "bid": data.get("bid"),
                        "ask": data.get("ask"),
                        "last": data.get("last"),
                        "spread": data.get("spread"),
                        "point": data.get("point"),
                        "digits": data.get("digits"),
                        "timestamp": data.get("timestamp"),
                    }

        return FinancialWorldState(
            timestamp=_timestamp(state),

            instruments=instruments,

            market_conditions={
                "market": market,
                "market_features": state.get(
                    "market_features"
                ),
                "market_regime": state.get(
                    "market_regime"
                ),
                "trend": state.get(
                    "trend"
                ),
                "counter_trend_execution": state.get(
                    "counter_trend_execution"
                ),
            },

            volatility={
                "market_features": state.get(
                    "market_features"
                ),
            },

            liquidity={
                "market": market,
            },

            portfolio_state={
                "account": state.get("account") or {},
                "portfolio": state.get("portfolio") or {},
                "positions": state.get("positions") or [],
                "statistics": state.get("statistics") or {},
            },

            risk_state={
                "risk": state.get("risk") or {},
                "execution_risk": state.get(
                    "execution_risk"
                ),
            },

            external_context={
                "ai_decision": state.get(
                    "ai_decision"
                ),
                "ai_execution": state.get(
                    "ai_execution"
                ),
                "ai_execution_orchestrator": state.get(
                    "ai_execution_orchestrator"
                ),
                "order_builder": state.get(
                    "order_builder"
                ),
                "execution_queue": state.get(
                    "execution_queue"
                ),
                "vault": state.get("vault") or {},
                "execution": state.get(
                    "execution"
                ),
                "oms": state.get("oms"),
            },

            metadata={
                "source": "GlobalTradingStateService",
                "source_type": "authoritative_volsim_state",
                "read_only": True,
                "vfia_version": "0.1.0",
            },
        )

    def snapshot(self) -> FinancialWorldState:
        """
        Explicit capture operation.

        WARNING:
        GlobalTradingStateService.snapshot() is not a pure getter.
        It may evaluate existing VolSim-Pro intelligence,
        risk, execution, and downstream orchestration.

        Therefore VFIA should normally prefer from_state()
        when an authoritative state snapshot is already available.
        """

        state = global_trading_state_service.snapshot()

        return self.from_state(state)


def _timestamp(
    state: dict[str, Any],
) -> datetime:
    timestamp = state.get("timestamp")

    if isinstance(timestamp, datetime):
        return timestamp

    if timestamp is None:
        return datetime.now(timezone.utc)

    try:
        return datetime.fromtimestamp(
            float(timestamp),
            tz=timezone.utc,
        )
    except (TypeError, ValueError, OverflowError):
        return datetime.now(timezone.utc)


vfia_world_state_adapter = VFIAWorldStateAdapter()
