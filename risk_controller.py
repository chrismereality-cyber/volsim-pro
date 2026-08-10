import redis
import json

class RiskController:
    def __init__(self):
        self.r = redis.Redis(host='localhost', port=6380, db=0, decode_responses=True)
        self.MAX_DAILY_LOSS = 500.0

    def check_trade_eligibility(self, symbol, signal):
        # 1. Check current PnL from Redis (assuming another service tracks this)
        daily_pnl = float(self.r.get('metrics:daily_pnl') or 0.0)

        # 2. Hard Stop Check
        if daily_pnl < -self.MAX_DAILY_LOSS:
            return False, 'MAX_LOSS_EXCEEDED'

        # 3. Prevent over-trading (e.g., no signals if market is too volatile)
        # This is where you would integrate volatility filters

        return True, 'PROCEED'

# Example usage for your engine:
# risk = RiskController()
# allowed, reason = risk.check_trade_eligibility('XAUUSDm', 'BULLISH')
# if allowed:
#     # send to MT5 bridge
