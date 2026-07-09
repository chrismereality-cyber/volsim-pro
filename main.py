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
from vault_manager import get_latest_vault_balance
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
async def get_immutable_vault_metrics():
    try:
        if not mt5.initialize():
            mt5.initialize()
        account_info = mt5.account_info()
        current_balance = float(account_info.balance) if account_info is not None else 1129.12
        
        vault_balance = get_latest_vault_balance()
        total_capital = current_balance + vault_balance
        equity_pct = (current_balance / total_capital * 100) if total_capital > 0 else 100.0
        
        if equity_pct <= 10.0: next_tier_str = "10% - 20% Tier"
        elif equity_pct <= 20.0: next_tier_str = "20% - 30% Tier"
        elif equity_pct <= 30.0: next_tier_str = "30% - 40% Tier"
        elif equity_pct <= 40.0: next_tier_str = "40%+ Tier"
        else: next_tier_str = "Maximum Capital Preservation Cap Enforced"

        return {
            "tradingEquity": round(current_balance, 2),
            "vaultBalance": round(vault_balance, 2),
            "totalCapital": round(total_capital, 2),
            "equityPercentage": round(equity_pct, 2),
            "vaultPercentage": round(100.0 - equity_pct, 2),
            "nextTierThreshold": next_tier_str
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/trading-state")
async def websocket_trading_state(websocket: WebSocket):
    await websocket.accept()
    print("📡 [WEBSOCKET CONNECTED]: Frontend live streaming active with Vault Data Tracking.")
    
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
            
            # Fetch the live synchronized database value from our postgres vault_ledger
            live_vault = get_latest_vault_balance()
            
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
                "vault_balance": round(live_vault, 2),  # Crucial: Keeps frontend in perfect live step
                "positions": positions_array,
                "timestamp": datetime.datetime.utcnow().isoformat()
            }
            await websocket.send_json(payload)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("🔌 [WEBSOCKET DISCONNECTED]: Connection closed.")
    finally:
        db.close()