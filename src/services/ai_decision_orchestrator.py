import time

from src.services.mt5_service import mt5_service
from src.services.portfolio_service import portfolio_service
from src.services.risk_service import risk_engine_service
from src.services.statistics_service import statistics_service
from src.services.counter_trend_execution_service import counter_trend_execution_service
from src.services.trend_detection_service import trend_detection_service
from src.services.market_regime_service import market_regime_service


class AIDecisionOrchestrator:

    """
    Enterprise AI Decision Layer.

    Aggregates:
    - Trend Engine
    - Market Regime
    - Risk Engine
    - Counter Trend Engine

    Produces:
    - BUY
    - SELL
    - HOLD
    """

    def __init__(self):

        self.state = {

            "status": "ONLINE",

            "decision": "HOLD",

            "reason": "Awaiting evaluation",

            "confidence": 0.0,

            "trend_signal": "NONE",

            "counter_trend_signal": "NONE",

            "risk_permission": False,

            "execution_allowed": False,

            "last_update": time.time()

        }


    def evaluate(self):

        account = mt5_service.get_account_state()

        portfolio = portfolio_service.get_portfolio_state()

        risk = risk_engine_service.snapshot()


        trend_detection_service.evaluate()

        trend = trend_detection_service.snapshot()


        market_regime_service.evaluate()

        regime = market_regime_service.snapshot()


        counter = counter_trend_execution_service.snapshot()



        trend_signal = trend.get(
            "trend",
            "NONE"
        )


        confidence = trend.get(
            "confidence",
            0
        )


        risk_permission = True


        decision = "HOLD"

        reason = "No valid execution signal"



        #
        # Primary execution logic
        #

        if (
            trend_signal == "BULLISH"
            and confidence >= 25
            and risk_permission
        ):

            decision = "BUY"

            reason = (
                "Bullish trend alignment "
                "with acceptable confidence"
            )



        elif (
            trend_signal == "BEARISH"
            and confidence >= 25
            and risk_permission
        ):

            decision = "SELL"

            reason = (
                "Bearish trend alignment "
                "with acceptable confidence"
            )



        self.state.update({

            "trend_signal": trend_signal,

            "counter_trend_signal":
                counter.get(
                    "signal",
                    "NONE"
                ),

            "risk_permission":
                risk_permission,

            "execution_allowed":
                risk_permission,


            "decision":
                decision,


            "reason":
                reason,


            "confidence":
                confidence,


            "last_update":
                time.time()

        })


        return self.state



    def snapshot(self):

        return self.state



ai_decision_orchestrator = AIDecisionOrchestrator()
