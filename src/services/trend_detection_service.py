import time

from src.services.market_feature_service import market_feature_service


class TrendDetectionService:
    """
    Enterprise Trend Detection Engine.

    Uses:
    - EMA alignment
    - RSI momentum
    - ATR volatility
    - Trend strength

    Outputs:
    - Primary market direction
    - Confidence score
    - Market phase

    Used by:
    - AI Decision Orchestrator
    - Counter Trend Engine
    - Execution Engine
    """

    def __init__(self):

        self.state = {

            "status": "ONLINE",

            "trend": "NONE",

            "confidence": 0.0,

            "strength": 0.0,

            "market_phase": "WAITING",

            "last_update": time.time()

        }


    def evaluate(self):

        market_feature_service.evaluate()

        features = market_feature_service.snapshot()


        ema20 = features.get("ema20", 0)

        ema50 = features.get("ema50", 0)

        ema200 = features.get("ema200", 0)

        rsi = features.get("rsi", 50)

        trend_strength = features.get(
            "trend_strength",
            0
        )

        volatility = features.get(
            "volatility_score",
            0
        )


        trend = "NONE"

        market_phase = "WAITING"


        # Bullish structure

        if (
            ema20 > ema50
            and ema50 > ema200
        ):

            trend = "BULLISH"

            market_phase = "TRENDING_UP"



        # Bearish structure

        elif (
            ema20 < ema50
            and ema50 < ema200
        ):

            trend = "BEARISH"

            market_phase = "TRENDING_DOWN"



        # Range condition

        else:

            trend = "SIDEWAYS"

            market_phase = "RANGE"



        #
        # Confidence model
        #

        momentum_score = 0


        if trend == "BULLISH":

            momentum_score = min(
                max((rsi - 50) * 2, 0),
                100
            )


        elif trend == "BEARISH":

            momentum_score = min(
                max((50 - rsi) * 2, 0),
                100
            )


        strength_score = min(
            abs(trend_strength) * 20,
            100
        )


        volatility_score = min(
            volatility * 100,
            100
        )


        confidence = round(
            (
                momentum_score * 0.4
                +
                strength_score * 0.4
                +
                volatility_score * 0.2
            ),
            2
        )


        self.state.update({

            "trend": trend,

            "confidence": confidence,

            "strength": trend_strength,

            "market_phase": market_phase,

            "last_update": time.time()

        })


        return self.state



    def snapshot(self):

        return self.state



trend_detection_service = TrendDetectionService()
