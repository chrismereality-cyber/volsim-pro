import time


class CounterTrendExecutionService:
    """
    Institutional Counter Trend Overlay Engine.

    Generates temporary protective
    counter-position signals.

    Does NOT execute orders.
    Execution Engine consumes this state.
    """


    def __init__(self):

        self.state = {

            "status": "ACTIVE",

            "enabled": True,

            "signal": "NONE",

            "confidence": 0.0,

            "reason": "Waiting",

            "direction": None,

            "overlay_position_size": 0.0,

            "trigger": {},

            "last_update": time.time()

        }


    def snapshot(self):

        return self.state



    def evaluate(
        self,
        market_state,
        portfolio_state,
        risk_state
    ):


        trend = (
            market_state
            .get("trend","NONE")
        )


        rsi = float(
            market_state.get("rsi",0)
        )


        atr = float(
            market_state.get("atr",0)
        )


        drawdown = float(
            risk_state.get(
                "drawdown",
                0
            )
        )


        self.state["trigger"] = {

            "trend":trend,

            "rsi":rsi,

            "atr":atr,

            "drawdown":drawdown

        }



        signal="NONE"

        direction=None

        confidence=0

        reason="No counter trend condition"



        # Bullish exhaustion protection

        if trend == "BULLISH":

            if (
                rsi >= 70
                or drawdown >= 1.0
            ):

                signal="SELL"

                direction="BEARISH"

                confidence=75

                reason=(
                    "Bullish exhaustion "
                    "counter trend overlay"
                )



        # Bearish exhaustion protection

        elif trend == "BEARISH":

            if (
                rsi <= 30
                or drawdown >= 1.0
            ):

                signal="BUY"

                direction="BULLISH"

                confidence=75

                reason=(
                    "Bearish exhaustion "
                    "counter trend overlay"
                )



        self.state.update({

            "signal":signal,

            "confidence":confidence,

            "reason":reason,

            "direction":direction,

            "overlay_position_size":(
                0.25
                if signal != "NONE"
                else 0.0
            ),

            "last_update":time.time()

        })


        return self.state



counter_trend_execution_service = CounterTrendExecutionService()
