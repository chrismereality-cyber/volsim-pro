import time
import asyncio

from src.services.mt5_service import mt5_service
from src.services.position_service import position_service
from src.services.portfolio_service import portfolio_service
from src.services.risk_service import risk_engine_service
from src.services.execution_service import execution_service
from src.services.oms_service import oms_service
from src.services.statistics_service import statistics_service
from src.services.vault_service import vault_service
from src.services.market_feature_service import market_feature_service
from src.services.market_regime_service import market_regime_service
from src.services.trend_detection_service import trend_detection_service
from src.services.counter_trend_execution_service import (
    counter_trend_execution_service,
)
from src.services.ai_decision_orchestrator import (
    ai_decision_orchestrator,
)
from src.services.ai_execution_service import (
    ai_execution_service,
)
from src.services.ai_position_management_service import (
    ai_position_management_service,
)
from src.services.ai_execution_orchestrator import (
    ai_execution_orchestrator,
)
from src.services.execution_risk_gate_service import (
    execution_risk_gate_service,
)
from src.services.order_builder_service import (
    order_builder_service,
)
from src.services.execution_queue_service import (
    execution_queue_service,
)
from src.services.global_venue_context_service import (
    global_venue_context_service,
)


class GlobalTradingStateService:
    """
    Enterprise Global Trading State.

    Single backend source of truth.

    Global infrastructure:
        Account
        Portfolio
        Vault
        Positions
        Global Risk
        Venue Context
        Execution Queue
        Execution Service
        OMS
        Statistics

    Symbol-scoped intelligence:
        Market Features
        Market Regime
        Trend
        Counter Trend
        AI Decision
        AI Execution
        Execution Risk Gate
        Order Builder
        AI Execution Orchestrator

    Execution infrastructure remains centralized.
    """

    DEFAULT_SYMBOL = "XAUUSDm"

    ACTIVE_SYMBOLS = (
        "XAUUSDm",
        "BTCUSDm",
    )

    def _evaluate_symbol(
        self,
        symbol,
        portfolio_state,
        risk_state,
    ):
        """
        Evaluate the complete symbol-scoped intelligence and
        execution-preparation pipeline.

        No duplicate execution engine is created per symbol.
        """

        # --------------------------------------------------------------
        # MARKET FEATURES
        # --------------------------------------------------------------

        market_feature_service.evaluate(
            symbol=symbol
        )

        market_features = (
            market_feature_service.snapshot(
                symbol=symbol
            )
        )

        # --------------------------------------------------------------
        # MARKET REGIME
        # --------------------------------------------------------------

        market_regime_service.evaluate(
            symbol=symbol
        )

        market_regime = (
            market_regime_service.snapshot(
                symbol=symbol
            )
        )

        # --------------------------------------------------------------
        # TREND
        # --------------------------------------------------------------

        trend_detection_service.evaluate(
            symbol=symbol
        )

        trend_state = (
            trend_detection_service.snapshot(
                symbol=symbol
            )
        )

        # --------------------------------------------------------------
        # COMBINED SYMBOL MARKET STATE
        # --------------------------------------------------------------

        market_state = {
            **market_features,
            **trend_state,
        }

        # --------------------------------------------------------------
        # COUNTER-TREND OVERLAY
        # --------------------------------------------------------------

        counter_trend_execution_service.evaluate(
            market_state,
            portfolio_state,
            risk_state,
            symbol=symbol,
        )

        counter_trend_state = (
            counter_trend_execution_service.snapshot(
                symbol=symbol
            )
        )

        # --------------------------------------------------------------
        # AI DECISION
        # --------------------------------------------------------------

        ai_decision = (
            ai_decision_orchestrator.evaluate(
                symbol=symbol
            )
        )

        # --------------------------------------------------------------
        # AI POSITION MANAGEMENT
        # --------------------------------------------------------------

        position_snapshot = position_service.snapshot()

        open_position = next(
            (
                position
                for position in position_snapshot.get(
                    "open_positions",
                    []
                )
                if position.get("symbol") == symbol
                and position.get("status") == "OPEN"
            ),
            None,
        )

        position_management = (
            ai_position_management_service.evaluate(
                open_position,
                ai_decision,
            )
        )

        execution_decision = dict(ai_decision)

        # Preserve the market context observed at AI decision time.
        # These fields are analytical attribution data only.
        execution_decision["regime"] = market_regime.get("regime")
        execution_decision["volatility"] = market_regime.get("volatility")
        execution_decision["atr"] = market_features.get("atr")
        execution_decision["rsi"] = market_features.get("rsi")
        execution_decision["ema20"] = market_features.get("ema20")
        execution_decision["ema50"] = market_features.get("ema50")
        execution_decision["ema200"] = market_features.get("ema200")
        execution_decision["spread"] = market_features.get("spread")

        if (
            position_management.get("action") == "EXIT"
            and position_management.get(
                "execution_authorized",
                False,
            )
        ):
            execution_decision["decision"] = "EXIT"
            execution_decision["trade_id"] = position_management.get("trade_id")
            execution_decision["position_side"] = position_management.get("position_side")

        # --------------------------------------------------------------
        # AI EXECUTION SIGNAL
        # --------------------------------------------------------------

        ai_execution = (
            ai_execution_service.evaluate(
                execution_decision,
                risk_state,
                portfolio_state,
                symbol=symbol,
            )
        )

        # --------------------------------------------------------------
        # EXECUTION RISK GATE
        # --------------------------------------------------------------

        execution_risk = (
            execution_risk_gate_service.approve(
                execution_decision,
                ai_execution,
                risk_state,
                portfolio_state,
                symbol=symbol,
            )
        )

        # --------------------------------------------------------------
        # ORDER BUILDER
        # --------------------------------------------------------------

        order_state = (
            order_builder_service.build(
                execution_decision,
                execution_risk,
                symbol=symbol,
            )
        )

        # --------------------------------------------------------------
        # AI EXECUTION ORCHESTRATOR
        #
        # Global state snapshots are strictly read-only.
        #
        # IMPORTANT:
        # snapshot() must never dispatch an order. Explicit execution
        # cycles call the orchestrator separately.
        # --------------------------------------------------------------

        ai_execution_state = (
            ai_execution_orchestrator.snapshot(
                symbol=symbol
            )
        )

        return {
            "market_features": market_features,
            "market_regime": market_regime,
            "trend": trend_state,
            "market_state": market_state,
            "counter_trend_execution": counter_trend_state,
            "ai_decision": ai_decision,
            "execution_decision": execution_decision,
            "ai_position_management": position_management,
            "ai_execution": ai_execution,
            "execution_risk": execution_risk,
            "order_builder": order_state,
            "ai_execution_orchestrator": ai_execution_state,
        }

    async def execute_symbol(self, symbol):
        """
        Explicit AI-authorized execution cycle for one symbol.

        Global snapshot remains read-only. This method is the explicit
        execution boundary and delegates final dispatch to the centralized
        AI execution orchestrator.

        Execution is allowed only when:
            AI Execution Policy -> READY / EXECUTION_READY
            Execution Risk Gate -> approved
            Order Builder -> order_ready
        """

        if symbol not in self.ACTIVE_SYMBOLS:
            raise ValueError(
                f"Unsupported trading symbol: {symbol}"
            )

        # --------------------------------------------------------------
        # Shared global state
        # --------------------------------------------------------------

        portfolio_state = (
            portfolio_service.get_portfolio_state()
        )

        risk_state = (
            risk_engine_service.snapshot()
        )

        # --------------------------------------------------------------
        # Fresh symbol-scoped intelligence
        # --------------------------------------------------------------

        symbol_state = self._evaluate_symbol(
            symbol,
            portfolio_state,
            risk_state,
        )

        ai_decision = symbol_state["ai_decision"]
        ai_execution = symbol_state["ai_execution"]
        execution_risk = symbol_state["execution_risk"]
        order_state = symbol_state["order_builder"]

        # --------------------------------------------------------------
        # Explicit AI authorization boundary
        # --------------------------------------------------------------

        if (
            ai_execution.get("status") != "READY"
            or ai_execution.get("last_action")
            != "EXECUTION_READY"
        ):
            return {
                "symbol": symbol,
                "status": "BLOCKED",
                "last_action": "AI_EXECUTION_NOT_AUTHORIZED",
                "ai_decision": ai_decision,
                "ai_execution": ai_execution,
                "execution_risk": execution_risk,
                "order_builder": order_state,
                "ai_execution_orchestrator":
                    ai_execution_orchestrator.snapshot(
                        symbol=symbol
                    ),
            }

        # --------------------------------------------------------------
        # Execution risk authorization
        # --------------------------------------------------------------

        if not execution_risk.get(
            "approved",
            False,
        ):
            return {
                "symbol": symbol,
                "status": "BLOCKED",
                "last_action": "EXECUTION_RISK_REJECTED",
                "ai_decision": ai_decision,
                "ai_execution": ai_execution,
                "execution_risk": execution_risk,
                "order_builder": order_state,
                "ai_execution_orchestrator":
                    ai_execution_orchestrator.snapshot(
                        symbol=symbol
                    ),
            }

        # --------------------------------------------------------------
        # Order Builder authorization
        # --------------------------------------------------------------

        if not order_state.get(
            "order_ready",
            False,
        ):
            return {
                "symbol": symbol,
                "status": "BLOCKED",
                "last_action": "ORDER_NOT_READY",
                "ai_decision": ai_decision,
                "ai_execution": ai_execution,
                "execution_risk": execution_risk,
                "order_builder": order_state,
                "ai_execution_orchestrator":
                    ai_execution_orchestrator.snapshot(
                        symbol=symbol
                    ),
            }

        # --------------------------------------------------------------
        # Centralized execution orchestration
        # --------------------------------------------------------------

        orchestrator_state = (
            await ai_execution_orchestrator.evaluate(
                order_state,
                symbol=symbol,
                ai_execution=ai_execution,
            )
        )

        return {
            "symbol": symbol,
            "status": "EXECUTION_CYCLE_COMPLETE",
            "last_action":
                orchestrator_state.get(
                    "last_action",
                    "UNKNOWN",
                ),
            "ai_decision": ai_decision,
            "ai_execution": ai_execution,
            "execution_risk": execution_risk,
            "order_builder": order_state,
            "ai_execution_orchestrator":
                orchestrator_state,
        }


    def snapshot(self):
        """
        Return the complete global trading state.

        Global services remain singletons.

        Symbol-specific intelligence is evaluated independently for
        XAUUSDm and BTCUSDm.
        """

        # ==============================================================
        # ACCOUNT
        # ==============================================================

        account_state = (
            mt5_service.get_account_state()
        )

        # ==============================================================
        # MARKET -> POSITION PROPAGATION
        # ==============================================================

        market_snapshot = (
            mt5_service.get_market_state()
        )

        position_service.sync_market_prices(
            market_snapshot
        )

        # ==============================================================
        # PORTFOLIO
        # ==============================================================

        portfolio_state = (
            portfolio_service.get_portfolio_state()
        )

        # ==============================================================
        # PROFIT ALLOCATION
        #
        # 70% -> Trading Equity
        # 30% -> Immutable Vault
        # ==============================================================

        realized_pl = float(
            portfolio_state.get(
                "realized_pl",
                0.0,
            )
        )

        vault_allocation = (
            vault_service.register_profit(
                realized_pl
            )
        )

        # ==============================================================
        # POSITIONS
        # ==============================================================

        position_state = (
            position_service.snapshot()
        )

        # ==============================================================
        # GLOBAL RISK
        # ==============================================================

        risk_state = (
            risk_engine_service.snapshot()
        )

        # ==============================================================
        # SYMBOL-SCOPED INTELLIGENCE
        # ==============================================================

        symbol_states = {}

        for symbol in self.ACTIVE_SYMBOLS:

            symbol_states[symbol] = (
                self._evaluate_symbol(
                    symbol,
                    portfolio_state,
                    risk_state,
                )
            )

        # ==============================================================
        # SYMBOL-SCOPED COLLECTIONS
        # ==============================================================

        market_features_by_symbol = {
            symbol:
                state["market_features"]
            for symbol, state in symbol_states.items()
        }

        market_regime_by_symbol = {
            symbol:
                state["market_regime"]
            for symbol, state in symbol_states.items()
        }

        trend_by_symbol = {
            symbol:
                state["trend"]
            for symbol, state in symbol_states.items()
        }

        counter_trend_by_symbol = {
            symbol:
                state["counter_trend_execution"]
            for symbol, state in symbol_states.items()
        }

        ai_decision_by_symbol = {
            symbol:
                state["ai_decision"]
            for symbol, state in symbol_states.items()
        }

        execution_decision_by_symbol = {
            symbol:
                state["execution_decision"]
            for symbol, state in symbol_states.items()
        }

        ai_execution_by_symbol = {
            symbol:
                state["ai_execution"]
            for symbol, state in symbol_states.items()
        }

        execution_risk_by_symbol = {
            symbol:
                state["execution_risk"]
            for symbol, state in symbol_states.items()
        }

        order_builder_by_symbol = {
            symbol:
                state["order_builder"]
            for symbol, state in symbol_states.items()
        }

        ai_execution_orchestrator_by_symbol = {
            symbol:
                state["ai_execution_orchestrator"]
            for symbol, state in symbol_states.items()
        }

        # ==============================================================
        # LEGACY DEFAULT-SYMBOL ALIASES
        #
        # Preserve the existing frontend/backend contract while
        # exposing the complete multi-symbol collections above.
        # ==============================================================

        default_state = (
            symbol_states[self.DEFAULT_SYMBOL]
        )

        market_features = (
            default_state["market_features"]
        )

        market_regime = (
            default_state["market_regime"]
        )

        trend_state = (
            default_state["trend"]
        )

        counter_trend_state = (
            default_state["counter_trend_execution"]
        )

        ai_decision = (
            default_state["ai_decision"]
        )

        execution_decision = (
            default_state["execution_decision"]
        )

        ai_execution = (
            default_state["ai_execution"]
        )

        execution_risk = (
            default_state["execution_risk"]
        )

        order_state = (
            default_state["order_builder"]
        )

        ai_execution_state = (
            default_state[
                "ai_execution_orchestrator"
            ]
        )

        # ==============================================================
        # CENTRALIZED EXECUTION QUEUE
        # ==============================================================

        execution_queue_state = (
            execution_queue_service.snapshot()
        )

        # ==============================================================
        # VAULT
        # ==============================================================

        vault_state = (
            vault_service.snapshot()
        )

        # ==============================================================
        # FINAL GLOBAL STATE
        # ==============================================================

        return {

            "timestamp":
                time.time(),

            # ----------------------------------------------------------
            # Global infrastructure
            # ----------------------------------------------------------

            "account":
                account_state,

            "market":
                mt5_service.get_market_state(),

            "venue_context":
                global_venue_context_service.snapshot(),

            "vault":
                vault_state,

            "portfolio":
                portfolio_state,

            "positions":
                position_state,

            "risk":
                risk_state,

            "execution":
                execution_service.snapshot(),

            "oms":
                oms_service.snapshot(),

            "statistics":
                statistics_service.snapshot(),

            "execution_queue":
                execution_queue_state,

            # ----------------------------------------------------------
            # Legacy XAUUSDm-compatible fields
            # ----------------------------------------------------------

            "market_features":
                market_features,

            "market_regime":
                market_regime,

            "trend":
                trend_state,

            "counter_trend_execution":
                counter_trend_state,

            "ai_decision":
                ai_decision,

            "execution_decision":
                execution_decision,

            "ai_execution":
                ai_execution,

            "execution_risk":
                execution_risk,

            "order_builder":
                order_state,

            "ai_execution_orchestrator":
                ai_execution_state,

            # ----------------------------------------------------------
            # Complete multi-symbol state
            # ----------------------------------------------------------

            "symbols":
                list(self.ACTIVE_SYMBOLS),

            "symbol_states":
                symbol_states,

            "market_features_by_symbol":
                market_features_by_symbol,

            "market_regime_by_symbol":
                market_regime_by_symbol,

            "trend_by_symbol":
                trend_by_symbol,

            "counter_trend_by_symbol":
                counter_trend_by_symbol,

            "ai_decision_by_symbol":
                ai_decision_by_symbol,

            "execution_decision_by_symbol":
                execution_decision_by_symbol,

            "ai_execution_by_symbol":
                ai_execution_by_symbol,

            "execution_risk_by_symbol":
                execution_risk_by_symbol,

            "order_builder_by_symbol":
                order_builder_by_symbol,

            "ai_execution_orchestrator_by_symbol":
                ai_execution_orchestrator_by_symbol,
        }


global_trading_state_service = GlobalTradingStateService()
