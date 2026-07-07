import numpy as np
from typing import List, Dict, Any

class InstitutionalRiskEngine:
    def __init__(self):
        # 20-Day Volatility profiles scaled for Assets (Daily Variance Baselines)
        self.volatility_map = {
            "XAUUSDm": 0.0125,       # Gold Volatility profile
            "BTCUSDm": 0.0240,       # Bitcoin Volatility profile
            "Volatility_100": 0.0350  # Synthetic Index Volatility profile
        }
        self.default_vol = 0.0150
        
    def calculate_position_metrics(self, active_positions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates institutional metrics from active open trades.
        """
        if not active_positions:
            return {
                "total_portfolio_value": 0.0,
                "net_exposure": 0.0,
                "asset_allocations": {}
            }
            
        total_value = 0.0
        net_exposure = 0.0
        allocations = {}
        
        for pos in active_positions:
            sym = pos.get("symbol", "Unknown")
            vol = pos.get("volume", 0.0)
            price = pos.get("current_price", 1.0)
            side = pos.get("side", "BUY")
            
            # Notional exposure calculation
            notional = vol * price
            total_value += pos.get("margin", notional * 0.05) # Margin or asset capital representation
            
            direction = 1.0 if side.upper() == "BUY" else -1.0
            pos_exposure = notional * direction
            net_exposure += pos_exposure
            
            allocations[sym] = allocations.get(sym, 0.0) + notional
            
        # Convert absolute allocations to percentages
        total_notional = sum(allocations.values()) if allocations else 1.0
        for sym in allocations:
            allocations[sym] = round((allocations[sym] / total_notional) * 100, 2)
            
        return {
            "total_portfolio_value": round(total_value, 2),
            "net_exposure": round(net_exposure, 2),
            "asset_allocations": allocations
        }
        
    def compute_parametric_var(self, active_positions: List[Dict[str, Any]], confidence_level: float = 0.95) -> float:
        """
        Computes 1-Day Parametric Value at Risk (VaR) using Variance-Covariance method.
        Z-Score for 95% confidence = 1.645
        """
        if not active_positions:
            return 0.0
            
        z_score = 1.645 if confidence_level == 0.95 else 2.33
        portfolio_variance = 0.0
        
        # Calculate individual variances assuming standalone index correlation for baseline metrics
        for pos in active_positions:
            sym = pos.get("symbol", "Unknown")
            vol = pos.get("volume", 0.0)
            price = pos.get("current_price", 1.0)
            
            notional = vol * price
            asset_vol = self.volatility_map.get(sym, self.default_vol)
            
            # Individual component cash variance position
            position_variance = (notional * asset_vol) ** 2
            portfolio_variance += position_variance
            
        portfolio_std_dev = np.sqrt(portfolio_variance)
        value_at_risk = portfolio_std_dev * z_score
        
        return round(float(value_at_risk), 2)
        
    def evaluate_hedge_triggers(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Flags warnings if portfolio constraints are breached.
        """
        net_exp = abs(metrics.get("net_exposure", 0.0))
        risk_status = "HEALTHY"
        hedging_orders = []
        
        # Institutional threshold alert triggers (e.g., exposure over $5,000 limits)
        if net_exp > 5000.0:
            risk_status = "WARNING"
            hedging_orders.append({
                "action": "AUTO_HEDGE_TRIGGERED",
                "reason": "Net absolute delta exposure limit exceeded baseline thresholds.",
                "suggested_hedge": "Deploy short correlation contracts to reduce system variance."
            })
        elif net_exp > 15000.0:
            risk_status = "CRITICAL"
            hedging_orders.append({
                "action": "LIQUIDATION_PROTECTION_ACTIVE",
                "reason": "Extreme margin exposure breach detected."
            })
            
        return {
            "risk_status": risk_status,
            "hedging_orders": hedging_orders
        }