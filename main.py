import asyncio
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import TradeRecord
from risk_engine import InstitutionalRiskEngine

app = FastAPI(title="VOLSIM-PRO Core Execution Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClosePositionRequest(BaseModel):
    ticket: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

risk_engine = InstitutionalRiskEngine()

@app.post("/api/positions/close")
async def close_position(payload: ClosePositionRequest, db: Session = Depends(get_db)):
    # Find the trade record
    position = db.query(TradeRecord).filter(
        TradeRecord.ticket == payload.ticket,
        TradeRecord.status == "OPEN"
    ).first()
    
    if not position:
        raise HTTPException(status_code=404, detail="Active position target not found.")
        
    # Set status to PENDING_CLOSE so the background bridge handles the deletion safely
    position.status = "PENDING_CLOSE"
    db.commit()
    print(f"🛑 [SIGNAL SENT]: Ticket {payload.ticket} flagged as PENDING_CLOSE for bridge execution.")
    return {"status": "success", "message": "Liquidation command enqueued."}

@app.get("/api/analytics/performance")
async def get_performance(timeframe: str = "30D", db: Session = Depends(get_db)):
    trades = db.query(TradeRecord).filter(TradeRecord.status == "CLOSED").order_by(TradeRecord.created_at.asc()).all()
    total_trades = len(trades)
    if total_trades == 0:
        return {"status": "success", "timeframe": timeframe, "sharpeRatio": 0.0, "profitFactor": 0.0, "sortinoRatio": 0.0, "winRate": 0.0, "winningTrades": 0, "losingTrades": 0, "totalTrades": 0, "maxDrawdown": 0.0, "avgWin": 0.0, "avgLoss": 0.0, "expectancy": 0.0, "maxConsecutiveWins": 0, "assetMetrics": []}

    profits = [t.profit for t in trades]
    winning_trades_list = [p for p in profits if p > 0]
    losing_trades_list = [p for p in profits if p < 0]
    win_rate = (len(winning_trades_list) / total_trades) * 100
    profit_factor = sum(winning_trades_list) / abs(sum(losing_trades_list)) if len(losing_trades_list) > 0 else 0.0

    avg_win = np.mean(winning_trades_list) if len(winning_trades_list) > 0 else 0.0
    avg_loss = np.mean(losing_trades_list) if len(losing_trades_list) > 0 else 0.0
    expectancy = ((len(winning_trades_list)/total_trades) * avg_win) + ((len(losing_trades_list)/total_trades) * avg_loss)

    max_consecutive_wins, current_streak = 0, 0
    for p in profits:
        if p > 0:
            current_streak += 1
            max_consecutive_wins = max(max_consecutive_wins, current_streak)
        else:
            current_streak = 0

    sharpe = (np.mean(profits) / np.std(profits) * np.sqrt(252)) if np.std(profits) > 0 else 0.0
    downside_std = np.std(np.array(profits)[np.array(profits) < 0]) if len(np.array(profits)[np.array(profits) < 0]) > 0 else 0.0
    sortino = (np.mean(profits) / downside_std * np.sqrt(252)) if downside_std > 0 else 0.0

    actual_current_balance = 1091.08
    profits_cumulative = np.cumsum(profits)
    initial_calculated_seed = actual_current_balance - profits_cumulative[-1] if len(profits_cumulative) > 0 else actual_current_balance
    if initial_calculated_seed <= 0:
        initial_calculated_seed = 1000.0
    equity_curve = initial_calculated_seed + profits_cumulative
    
    peaks = np.maximum.accumulate(equity_curve)
    max_drawdown = np.max((peaks - equity_curve) / peaks) * 100 if len(peaks) > 0 else 0.0

    asset_groups = {}
    for t in trades:
        if t.symbol not in asset_groups:
            asset_groups[t.symbol] = {"profits": [], "volumes": []}
        asset_groups[t.symbol]["profits"].append(t.profit)
        asset_groups[t.symbol]["volumes"].append(t.volume if hasattr(t, 'volume') and t.volume else 0.0)

    asset_metrics = []
    for symbol, data in asset_groups.items():
        sym_p = data["profits"]
        asset_metrics.append({
            "symbol": symbol,
            "volume": float(sum(data["volumes"])),
            "profit": float(sum(sym_p)),
            "win": float(sum([p for p in sym_p if p > 0])),
            "loss": float(abs(sum([p for p in sym_p if p < 0]))),
            "net": float(sum(sym_p)),
            "winRate": float((len([p for p in sym_p if p > 0]) / len(sym_p)) * 100),
            "trades": len(sym_p)
        })

    return {"status": "success", "timeframe": timeframe, "sharpeRatio": float(sharpe), "profitFactor": float(profit_factor), "sortinoRatio": float(sortino), "winRate": float(win_rate), "winningTrades": len(winning_trades_list), "losingTrades": len(losing_trades_list), "totalTrades": total_trades, "maxDrawdown": float(max_drawdown), "avgWin": float(avg_win), "avgLoss": float(avg_loss), "expectancy": float(expectancy), "maxConsecutiveWins": int(max_consecutive_wins), "assetMetrics": asset_metrics}

@app.websocket("/ws/trading-state")
async def websocket_trading_state(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()
    try:
        while True:
            closed_trades = db.query(TradeRecord).filter(TradeRecord.status == "CLOSED").all()
            open_trades = db.query(TradeRecord).filter(TradeRecord.status.in_(["OPEN", "PENDING_CLOSE"])).all()
            
            total_trades = len(closed_trades)
            net_profit = sum([t.profit for t in closed_trades])
            total_balance = 1091.08
            
            win_rate = 0.0
            profit_factor = 0.0
            expectancy = 0.0
            sharpe_ratio = 0.0
            max_dd = 0.0
            
            if total_trades > 0:
                profits = [t.profit for t in closed_trades]
                wins = [p for p in profits if p > 0]
                losses = [p for p in profits if p < 0]
                win_rate = (len(wins) / total_trades) * 100
                profit_factor = sum(wins) / abs(sum(losses)) if len(losses) > 0 else 0.0
                expectancy = np.mean(profits)
                sharpe_ratio = (np.mean(profits) / np.std(profits) * np.sqrt(252)) if np.std(profits) > 0 else 0.0
                
                initial_derived_seed = total_balance - net_profit
                equity_curve = initial_derived_seed + np.cumsum(profits)
                peaks = np.maximum.accumulate(equity_curve)
                max_dd = np.max((peaks - equity_curve) / peaks) * 100 if len(peaks) > 0 else 0.0
            else:
                peaks = [total_balance]

            calc_positions = []
            frontend_positions = []
            floating_pl = 0.0
            
            if open_trades:
                for t in open_trades:
                    calc_positions.append({
                        "symbol": t.symbol, "volume": t.volume, "current_price": 2350.0 if "XAU" in t.symbol else 65000.0, "side": "BUY", "margin": t.volume * 200.0
                    })
                    frontend_positions.append({
                        "ticket": t.ticket if t.ticket else str(t.id),
                        "symbol": t.symbol,
                        "type": "BUY", 
                        "volume": float(t.volume),
                        "openPrice": 2345.0 if "XAU" in t.symbol else 64900.0,
                        "currentPrice": (2345.0 + (t.profit / (t.volume * 100))) if "XAU" in t.symbol else 65000.0,
                        "profit": float(t.profit)
                    })
                floating_pl = sum([t.profit for t in open_trades])

            total_equity = total_balance + floating_pl
            metrics = risk_engine.calculate_position_metrics(calc_positions)
            hedge_status = risk_engine.evaluate_hedge_triggers(metrics)
            value_at_risk = risk_engine.compute_parametric_var(calc_positions)

            payload = {
                "event": "metrics_update",
                "balance": float(total_balance),
                "equity": float(total_equity),
                "floatingPl": float(floating_pl),
                "totalNetProfit": float(net_profit),
                "portfolio_value": float(metrics["total_portfolio_value"]),
                "net_exposure": float(metrics["net_exposure"]),
                "allocations": metrics["asset_allocations"],
                "risk_status": hedge_status["risk_status"],
                "value_at_risk": float(value_at_risk),
                "positions": frontend_positions
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(1)
            
    except WebSocketDisconnect:
        pass
    finally:
        db.close()