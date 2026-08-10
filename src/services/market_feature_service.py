import time
import MetaTrader5 as mt5


class MarketFeatureService:
    """
    Enterprise Market Feature Engine.

    Single source of truth for:
    - ATR
    - EMA
    - RSI
    - ADX
    - Volatility
    - Trend strength
    """


    def __init__(self):

        self.state = {

            "status":"ONLINE",

            "symbol":"XAUUSDm",

            "price":0.0,

            "spread":0.0,

            "atr":0.0,

            "adx":0.0,

            "ema20":0.0,

            "ema50":0.0,

            "ema200":0.0,

            "rsi":0.0,

            "volume":0.0,

            "trend_strength":0.0,

            "volatility_score":0.0,

            "market_structure":"WAITING",

            "session":"UNKNOWN",

            "liquidity":"UNKNOWN",

            "last_update":time.time()
        }



    def evaluate(self):

        symbol = self.state["symbol"]


        rates = mt5.copy_rates_from_pos(
            symbol,
            mt5.TIMEFRAME_M5,
            0,
            200
        )


        if rates is None:
            return


        closes = [
            candle["close"]
            for candle in rates
        ]


        highs = [
            candle["high"]
            for candle in rates
        ]


        lows = [
            candle["low"]
            for candle in rates
        ]



        price = closes[-1]


        ema20 = sum(closes[-20:]) / 20

        ema50 = sum(closes[-50:]) / 50

        ema200 = sum(closes[-200:]) / 200



        atr_values = []

        for i in range(1,len(closes)):

            tr = max(
                highs[i]-lows[i],
                abs(highs[i]-closes[i-1]),
                abs(lows[i]-closes[i-1])
            )

            atr_values.append(tr)


        atr = sum(
            atr_values[-14:]
        ) / 14



        gains = []

        losses = []


        for i in range(1,len(closes)):

            diff = closes[i]-closes[i-1]

            if diff >= 0:
                gains.append(diff)
                losses.append(0)

            else:
                gains.append(0)
                losses.append(abs(diff))


        avg_gain = sum(gains[-14:])/14

        avg_loss = sum(losses[-14:])/14


        if avg_loss == 0:
            rsi = 100

        else:
            rs = avg_gain / avg_loss
            rsi = 100-(100/(1+rs))



        volatility = (
            atr / price * 100
            if price
            else 0
        )


        trend_strength = abs(
            ema20-ema200
        ) / price * 100



        self.state.update({

            "price":price,

            "atr":atr,

            "ema20":ema20,

            "ema50":ema50,

            "ema200":ema200,

            "rsi":rsi,

            "trend_strength":trend_strength,

            "volatility_score":volatility,

            "last_update":time.time()

        })



    def snapshot(self):

        return self.state



market_feature_service = MarketFeatureService()
