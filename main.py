import asyncio
import numpy as np
import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import engine, SessionLocal
from models import TradeRecord, ImmutableVaultState
from risk_engine import InstitutionalRiskEngine
from vault_manager import ImmutableVaultEngine
import MetaTrader5 as mt5

app = FastAPI(title="VOLSIM-PRO Institutional Execution Engine")

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
vault_engine = ImmutableVaultEngine()

@app.post("/api/positions/close")
async def close_position(payload: ClosePositionRequest, db: Session = Depends(get_db)):
    position = db.query(TradeRecord).filter(
        TradeRecord.ticket == payload.ticket,
        TradeRecord.status == "OPEN"
    ).first()
    
    if not position:
        raise HTTPException(status_code=404, detail="Active position target not found.")
        
    position.status = "PENDING_CLOSE"
    db.commit()
    print(f"🛑 [SIGNAL SENT]: Ticket {payload.ticket} flagged as PENDING_CLOSE.")
    return {"status": "success", "message": "Liquidation command enqueued."}

@app.get("/api/vault/metrics")
async def get_immutable_vault_metrics(db: Session = Depends(get_db)):
    try:
        if not mt5.initialize():
            mt5.initialize()
        account_info = mt5.account_info()
        current_balance = float(account_info.balance) if account_info is not None else 1129.12
        
        state = db.query(ImmutableVaultState).order_by(ImmutableVaultState.id.desc()).first()
        if not state:
            state = ImmutableVaultState(trading_equity_balance=current_balance, vault_balance=0.0)
            db.add(state)
            db.commit()
            db.refresh(state)

        eq_alloc, vt_alloc, equity_pct = vault_engine.get_allocation_tier(
            state.trading_equity_balance, state.vault_balance
        )
        
        if equity_pct <= 10.0: next_tier_str = "10% - 20% Tier"
        elif equity_pct <= 20.0: next_tier_str = "20% - 30% Tier"
        elif equity_pct <= 30.0: next_tier_str = "30% - 40% Tier"
        elif equity_pct <= 40.0: next_tier_str = "40%+ Tier"
        else: next_tier_str = "Maximum Capital Preservation Cap Enforced"

        return {
            "tradingEquity": round(state.trading_equity_balance, 2),
            "vaultBalance": round(state.vault_balance, 2),
            "totalCapital": round(state.trading_equity_balance + state.vault_balance, 2),
            "equityPercentage": equity_pct,
            "vaultPercentage": round(100.0 - equity_pct, 2),
            "currentEquityAllocation": round(eq_alloc * 100, 2),
            "currentVaultAllocation": round(vt_alloc * 100, 2),
            "nextTierThreshold": next_tier_str,
            "stateHash": state.state_hash or "0x0000000000000000000000000000000000000000000000000000000000000000"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/performance")
async def get_performance(timeframe: str = "30D", db: Session = Depends(get_db)):
    try:
        trades = db.query(TradeRecord).filter(TradeRecord.status == "CLOSED").order_by(TradeRecord.created_at.asc()).all()
        profits = [float(t.profit) for t in trades]
        total_trades = len(profits)
        
        if not mt5.initialize():
            mt5.initialize()
            
        account_info = mt5.account_info()
        current_actual_balance = float(account_info.balance) if account_info is not None else 1129.12
        
        if total_trades == 0:
            return {
                "sharpeRatio": 0.0, "profitFactor": 1.0, "sortinoRatio": 0.0, "winRate": 0.0,
                "totalTrades": 0, "winningTrades": 0, "losingTrades": 0, "avgWin": 0.0, "avgLoss": 0.0,
                "maxDrawdown": 0.0, "expectancy": 0.0, "maxConsecutiveWins": 0, "assetMetrics": [], "data": []
            }
            
        winning_trades = sum(1 for p in profits if p > 0)
        losing_trades = sum(1 for p in profits if p < 0)
        win_rate = (winning_trades / total_trades * 100)
        
        gross_profits = sum(p for p in profits if p > 0)
        gross_losses = abs(sum(p for p in profits if p < 0))
        profit_factor = (gross_profits / gross_losses) if gross_losses > 0 else (gross_profits if gross_profits > 0 else 1.0)
        
        win_array = [p for p in profits if p > 0]
        loss_array = [p for p in profits if p < 0]
        avg_win = np.mean(win_array) if win_array else 0.0
        avg_loss = np.mean(loss_array) if loss_array else 0.0
        expectancy = ( (win_rate/100) * avg_win ) + ( (1 - (win_rate/100)) * avg_loss )
        
        max_consec_wins = 0
        current_consec = 0
        
        total_net_historical_change = sum(profits)
        running_equity = current_actual_balance - total_net_historical_change
        peak = running_equity
        max_dd = 0.0
        
        for p in profits:
            if p > 0:
                current_consec += 1
                max_consec_wins = max(max_consec_wins, current_consec)
            else:
                current_consec = 0
                
            running_equity += p
            if running_equity > peak:
                peak = running_equity
            if peak > 0:
                dd = ((peak - running_equity) / peak) * 100
                max_dd = max(max_dd, dd)

        sharpe_ratio, sortino_ratio = 0.0, 0.0
        if total_trades > 1:
            std_dev = np.std(profits)
            if std_dev > 0:
                sharpe_ratio = (np.mean(profits) / std_dev) * np.sqrt(252)
            downside_deviation = np.std(loss_array) if len(loss_array) > 1 else std_dev
            if downside_deviation > 0:
                sortino_ratio = (np.mean(profits) / downside_deviation) * np.sqrt(252)

        asset_map = {}
        for t in trades:
            sym = t.symbol
            if sym not in asset_map:
                asset_map[sym] = {"symbol": sym, "volume": 0.0, "profit": 0.0, "loss": 0.0, "net": 0.0}
            val = float(t.profit)
            asset_map[sym]["volume"] += float(t.volume)
            asset_map[sym]["net"] += val
            if val > 0:
                asset_map[sym]["profit"] += val
            else:
                asset_map[sym]["loss"] += abs(val)

        return {
            "sharpeRatio": float(sharpe_ratio),
            "profitFactor": float(profit_factor),
            "sortinoRatio": float(sortino_ratio),
            "winRate": float(win_rate),
            "totalTrades": total_trades,
            "winningTrades": winning_trades,
            "losingTrades": losing_trades,
            "avgWin": float(avg_win),
            "avgLoss": float(avg_loss),
            "maxDrawdown": float(max_dd),
            "expectancy": float(expectancy),
            "maxConsecutiveWins": max_consec_wins,
            "assetMetrics": list(asset_map.values()),
            "data": []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/trading-state")
async def websocket_trading_state(websocket: WebSocket):
    await websocket.accept()
    print("📡 [WEBSOCKET CONNECTED]: Frontend live streaming active.")
    
    if not mt5.initialize():
        print("❌ [MT5 ERROR]: Could not bind to local terminal from websocket runtime.")
        
    db = SessionLocal()
    try:
        while True:
            open_trades = db.query(TradeRecord).filter(TradeRecord.status == "OPEN").all()
            
            account_info = mt5.account_info()
            if account_info is not None:
                account_balance = float(account_info.balance)
                account_equity = float(account_info.equity)
                floating_pl = float(account_info.profit)
            else:
                floating_pl = sum(float(t.profit) for t in open_trades)
                account_balance = 1129.12
                account_equity = account_balance + floating_pl
            
            positions_array = []
            for pos in open_trades:
                positions_array.append({
                    "ticket": pos.ticket,
                    "symbol": pos.symbol,
                    "type": "BUY" if float(pos.profit) >= 0 else "SELL",
                    "volume": float(pos.volume),
                    "profit": float(pos.profit)
                })
                
            payload = {
                "balance": round(account_balance, 2),
                "equity": round(account_equity, 2),
                "floating_pl": round(floating_pl, 2),
                "positions": positions_array,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("🔌 [WEBSOCKET DISCONNECTED]: Connection closed.")
    finally:
        db.close()