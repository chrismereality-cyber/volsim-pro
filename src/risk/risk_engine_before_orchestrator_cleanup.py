import numpy as np
import time
import os
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Body

router = APIRouter()

class GlobalTradingStateEngine:
    def __init__(self):
        try:
            import redis
            self.redis_client = redis.Redis(host=os.getenv('REDIS_HOST', 'localhost'), port=6380, db=0, decode_responses=True)
        except Exception:
            self.redis_client = None

    def get_global_state(self):
        balance = 10000.0
        equity = 10000.0
        free_margin = 10000.0
        margin = 0.0
        pnl = 0.0
        positions_count = 0

        if self.redis_client:
            try:
                balance = float(self.redis_client.get('mt5:balance') or balance)
                equity = float(self.redis_client.get('mt5:equity') or equity)
                free_margin = float(self.redis_client.get('mt5:free_margin') or free_margin)
                pnl = float(self.redis_client.get('metrics:daily_pnl') or pnl)
                positions_count = int(self.redis_client.get('mt5:positions_count') or positions_count)
            except Exception:
                pass

        return {
            "account_state": {
                "account_number": "9928192",
                "broker_name": "MetaQuotes-Demo",
                "server": "MetaTrader5-Server",
                "account_type": "Hedging",
                "currency": "USD",
                "balance": balance,
                "equity": equity,
                "floating_profit_loss": pnl,
                "margin": margin,
                "free_margin": free_margin,
                "margin_level": 0.0 if margin == 0 else (equity / margin) * 100,
                "credit": 0.0,
                "leverage": 100,
                "daily_drawdown": 0.0,
                "maximum_drawdown": 1.5
            },
            "market_state": {
                "live_prices": {"EURUSD": 1.0845, "GBPUSD": 1.2650},
                "bid": 1.0844,
                "ask": 1.0845,
                "spread": 1.0,
                "tick_volume": 1420,
                "market_regime": "Mean Reversion",
                "volatility": "Moderate",
                "atr": 0.0012,
                "session": "London / New York Overlap"
            },
            "execution_state": {
                "pending_orders": 0,
                "open_orders": positions_count,
                "order_latency_ms": 14.2,
                "slippage_pips": 0.1,
                "fill_percentage": 100.0,
                "bridge_connection_status": "ONLINE"
            },
            "position_state": {
                "open_positions": [],
                "total_exposure": 0.0
            },
            "portfolio_state": {
                "total_balance": balance,
                "total_equity": equity,
                "daily_profit": pnl,
                "weekly_profit": pnl * 3,
                "monthly_profit": pnl * 12,
                "total_return": 5.4,

                "allocations": {
                    "XAUUSD": 45.0,
                    "EURUSD": 30.0,
                    "GBPUSD": 15.0,
                    "USDJPY": 10.0
                }
            },
            "risk_state": {
                "risk_per_trade": 1.0,
                "current_drawdown": 0.0,
                "maximum_allowed_drawdown": 5.0,

                "margin_usage": 0.0,

                "value_at_risk": 245.75,

                "hedging_signals": [
                    {
                        "asset": "XAUUSD",
                        "status": "WATCH",
                        "action": "Monitor",
                        "reason": "Drawdown below hedge threshold."
                    }
                ],

                "liquidation_warning": False
            },
            "statistics_state": {
                "total_trades": 120,
                "winning_trades": 78,
                "losing_trades": 42,
                "win_rate": 65.0,
                "profit_factor": 1.85,
                "sharpe_ratio": 2.15,
                "sortino_ratio": 2.45,
                "expectancy": 42.50
            },
            "vault_state": {
                "vault_balance": balance,
                "total_allocated_profit": pnl * 0.2,
                "allocation_percentage": 20.0,
                "blockchain_status": "SYNCED",
                "wallet_address": "0x71C...3A9"
            },
            "ai_state": {
                "confidence_score": 88.5,
                "buy_probability": 0.74,
                "sell_probability": 0.16,
                "hold_probability": 0.10,
                "active_strategy": "Volatility Breakout Matrix",
                "market_regime_detection": "Bullish Trend Continuation",
                "trend_bias": "BULLISH",
                "volatility_assessment": "Expanding",
                "signal_strength": "HIGH",
                "rsi": 58.4,
                "macd": 0.0015,
                "model_version": "volsim-ai-v6.2-enterprise",
                "decision_latency_ms": 4.1,
                "current_recommendation": "BUY",
                "expected_risk_reward": 2.5,
                "expected_value": 0.65,
                "reasoning_summary": "Order block convergence detected at primary liquidity pool with positive volume delta confirmation.",
                "next_planned_action": "Monitor breakout continuation above 1.0850."
            },
            "timestamp": time.time()
        }

engine = GlobalTradingStateEngine()

@router.get("/telemetry")
async def get_telemetry():
    from src.services.global_state_service import global_state_orchestrator
    return global_state_orchestrator.snapshot()

@router.get("/metrics")
async def get_metrics():
    from src.services.global_state_service import global_state_orchestrator
    return global_state_orchestrator.snapshot()

@router.get("/analytics/performance")
async def get_performance_analytics(timeframe: str = Query("30D")):
    from src.services.global_state_service import global_state_orchestrator
    state = global_state_orchestrator.snapshot()
    return {
        "timeframe": timeframe,
        "performance_curve": [
            {"timestamp": time.time() - 86400 * i, "equity": 10000.0 + (i * 12.0)}
            for i in range(30, 0, -1)
        ],
        "summary": state["statistics_state"]
    }

@router.get("/risk/limits")
async def get_risk_limits():
    return {
        "max_drawdown_limit": 5.0,
        "max_position_size": 2.0,
        "daily_loss_limit": 500.0,
        "circuit_breaker_active": False
    }

@router.post("/risk/config")
async def update_risk_config(payload: dict = Body(...)):
    return {"status": "success", "updated_config": payload}


@router.websocket("/trading-state")
async def websocket_trading_state(websocket: WebSocket):

    from src.services.global_state_service import global_state_orchestrator

    await websocket.accept()

    try:
        while True:
            state = global_state_orchestrator.snapshot()
            await websocket.send_json(state)
            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        pass

    except Exception as e:
        print(f"WS Trading State Error: {e}")
