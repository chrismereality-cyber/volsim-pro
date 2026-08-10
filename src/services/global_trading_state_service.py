import time

from src.services.mt5_service import mt5_service
from src.services.position_service import position_service
from src.services.portfolio_service import portfolio_service
from src.services.risk_service import risk_engine_service
from src.services.execution_service import execution_service
from src.services.oms_service import oms_service
from src.services.statistics_service import statistics_service

from src.services.market_feature_service import market_feature_service
from src.services.market_regime_service import market_regime_service
from src.services.trend_detection_service import trend_detection_service
from src.services.counter_trend_execution_service import counter_trend_execution_service

from src.services.ai_decision_orchestrator import ai_decision_orchestrator
from src.services.ai_execution_service import ai_execution_service
from src.services.ai_execution_orchestrator import ai_execution_orchestrator
from src.services.execution_risk_gate_service import execution_risk_gate_service
from src.services.order_builder_service import order_builder_service
from src.services.execution_queue_service import execution_queue_service


class GlobalTradingStateService:
    """
    Enterprise Global Trading State.

    Single backend source of truth.

    Execution pipeline:

        Market Intelligence
                |
                v
        AI Decision
                |
                v
        Execution Risk Gate
                |
                v
        Order Builder
                |
                v
        AI Execution Orchestrator
                |
                v
        Execution Queue
                |
                v
        Execution Service
                |
                v
              OMS
    """

    def snapshot(self):

        #
        # ACCOUNT
        #

        account_state = (
            mt5_service.get_account_state()
        )


        #
        # MARKET -> POSITION PROPAGATION
        #

        market_snapshot = (
            mt5_service.get_market_state()
        )

        position_service.sync_market_prices(
            market_snapshot
        )


        #
        # PORTFOLIO
        #

        portfolio_state = (
            portfolio_service.get_portfolio_state()
        )


        #
        # POSITIONS
        #

        position_state = (
            position_service.snapshot()
        )


        #
        # RISK
        #

        risk_state = (
            risk_engine_service.snapshot()
        )


        #
        # MARKET INTELLIGENCE
        #

        market_feature_service.evaluate()
        market_regime_service.evaluate()
        trend_detection_service.evaluate()

        market_features = (
            market_feature_service.snapshot()
        )

        market_regime = (
            market_regime_service.snapshot()
        )

        trend_state = (
            trend_detection_service.snapshot()
        )


        #
        # COMBINED MARKET STATE
        #

        market_state = {
            **market_features,
            **trend_state
        }


        #
        # COUNTER-TREND OVERLAY
        #

        counter_trend_execution_service.evaluate(
            market_state,
            portfolio_state,
            risk_state
        )

        counter_trend_state = (
            counter_trend_execution_service.snapshot()
        )


        #
        # AI DECISION
        #

        ai_decision_orchestrator.evaluate()

        ai_decision = (
            ai_decision_orchestrator.snapshot()
        )


        #
        # AI EXECUTION SIGNAL
        #

        ai_execution_service.evaluate(
            ai_decision,
            risk_state,
            portfolio_state
        )

        ai_execution = (
            ai_execution_service.snapshot()
        )


        #
        # EXECUTION RISK GATE
        #

        execution_risk = (
            execution_risk_gate_service.approve(
                ai_decision,
                ai_execution,
                risk_state,
                portfolio_state
            )
        )


        #
        # ORDER BUILDER
        #

        order_state = (
            order_builder_service.build(
                ai_decision,
                execution_risk
            )
        )


        #
        # AI EXECUTION ORCHESTRATOR
        #

        try:

            import asyncio

            try:

                asyncio.get_running_loop()

                ai_execution_state = (
                    ai_execution_orchestrator.snapshot()
                )

            except RuntimeError:

                ai_execution_state = (
                    asyncio.run(
                        ai_execution_orchestrator.evaluate(
                            order_state
                        )
                    )
                )

        except Exception as exc:

            ai_execution_state = {

                "status": "ERROR",

                "execution_signal": "NONE",

                "last_action": "ORCHESTRATOR_ERROR",

                "last_order": None,

                "last_result": {

                    "success": False,

                    "message": str(exc)

                },

                "last_update": time.time(),

                "queue": execution_queue_service.snapshot()

            }


        #
        # EXECUTION QUEUE
        #

        execution_queue_state = (
            execution_queue_service.snapshot()
        )


        #
        # FINAL GLOBAL STATE
        #

        return {

            "timestamp":
                time.time(),

            "account":
                account_state,

            "market":
                mt5_service.get_market_state(),

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

            "ai_execution":
                ai_execution,

            "execution_risk":
                execution_risk,

            "order_builder":
                order_state,

            "ai_execution_orchestrator":
                ai_execution_state,

            "execution_queue":
                execution_queue_state,

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
                statistics_service.snapshot()

        }


global_trading_state_service = GlobalTradingStateService()
