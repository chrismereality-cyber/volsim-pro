import time

from src.services.market_feature_service import market_feature_service


class MarketRegimeService:

    def __init__(self):

        self.state = {

            "status": "ONLINE",

            "regime": "WAITING",

            "volatility": "UNKNOWN",

            "trend_quality": 0.0,

            "execution_mode": "WAIT",

            "confidence": 0.0,

            "last_update": time.time()

        }

    def evaluate(self):

        market_feature_service.evaluate()

        features = market_feature_service.snapshot()

        self.state.update({

            "trend_quality":
                features["trend_strength"],

            "confidence":
                features["volatility_score"],

            "last_update":
                time.time()

        })

    def snapshot(self):

        return self.state


market_regime_service = MarketRegimeService()
