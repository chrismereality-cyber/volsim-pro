import math
import numpy as np
from sqlalchemy.orm import Session
from database import engine
from models import TradeRecord  # Updated to match your exact schema model name

class InstitutionalRiskEngine:
    def __init__(self, max_drawdown_pct: float = 0.05, max_asset_exposure_pct: float = 0.15):
        self.max_drawdown_pct = max_drawdown_pct
        self.max_asset_exposure_pct = max_asset_exposure_pct
        
        self.correlation_matrix = {
            "XAUUSDm": {"XAUUSDm": 1.0, "Volatility_100": 0.05},
            "Volatility_100": {"XAUUSDm": 0.05, "Volatility_100": 1.0}
        }

    def calculate_position_metrics(self, positions: list) -> dict:
        total_portfolio_value = 0.0
        net_exposure = 0.0
        asset_allocations = {}
        
        for pos in positions:
            notional = pos['volume'] * pos['current_price']
            total_portfolio_value += pos.get('margin', 0) * 10
            
            direction = 1 if pos['side'].upper() == 'BUY' else -1
            signed_exposure = notional * direction
            net_exposure += signed_exposure
            
            asset_allocations[pos['symbol']] = asset_allocations.get(pos['symbol'], 0.0) + signed_exposure

        return {
            "total_portfolio_value": total_portfolio_value,
            "net_exposure": net_exposure,
            "asset_allocations": asset_allocations
        }

    def evaluate_hedge_triggers(self, metrics: dict) -> dict:
        hedge_actions = []
        allocations = metrics["asset_allocations"]
        portfolio_value = metrics["total_portfolio_value"] if metrics["total_portfolio_value"] > 0 else 10000.0

        for asset, exposure in allocations.items():
            exposure_pct = abs(exposure) / portfolio_value
            
            if exposure_pct > self.max_asset_exposure_pct:
                hedge_ratio = 0.5
                required_hedge_volume = (abs(exposure) * hedge_ratio) / (exposure / abs(exposure))
                
                hedge_actions.append({
                    "asset": asset,
                    "status": "BREACHED",
                    "action": "EXECUTE_HEDGE",
                    "reason": f"Exposure ({exposure_pct:.2%}) exceeded limits ({self.max_asset_exposure_pct:.2%})",
                    "target_delta_offset": -required_hedge_volume
                })
            else:
                hedge_actions.append({
                    "asset": asset,
                    "status": "NOMINAL",
                    "action": "HOLD"
                })

        return {
            "risk_status": "ALARM" if any(h["status"] == "BREACHED" for h in hedge_actions) else "HEALTHY",
            "hedging_orders": hedge_actions
        }

    def compute_parametric_var(self, positions: list, confidence_level: float = 0.95) -> float:
        if not positions:
            return 0.0
        z_score = 1.645 if confidence_level == 0.95 else 2.326
        estimated_volatility = 0.02
        
        total_notional = sum(pos['volume'] * pos['current_price'] for pos in positions)
        var_value = total_notional * estimated_volatility * z_score
        return var_value

if __name__ == "__main__":
    print("// Risk Engine Framework Compiled and ready.")