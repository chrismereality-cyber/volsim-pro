from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import MetaTrader5 as mt5

app = FastAPI(title="VolSim-Pro Core Engine", version="6.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PositionSchema(BaseModel):
    id: int
    asset: str
    type: str
    lots: float
    profit: float

class TradeRequest(BaseModel):
    action: str
    symbol: str
    volume: float

@app.post("/api/execute")
def execute_trade(req: TradeRequest):
    if not mt5.initialize():
        return {"status": "error", "message": "MT5 kernel disconnected."}
        
    order_type = mt5.ORDER_TYPE_BUY if req.action.upper() == "BUY" else mt5.ORDER_TYPE_SELL
    tick = mt5.symbol_info_tick(req.symbol)
    
    if tick is None:
        return {"status": "error", "message": f"Symbol {req.symbol} unreadable. Check Market Watch."}
        
    price = tick.ask if order_type == mt5.ORDER_TYPE_BUY else tick.bid
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": req.symbol,
        "volume": float(req.volume),
        "type": order_type,
        "price": price,
        "deviation": 20,
        "magic": 777000,
        "comment": "VolSim-Pro TX",
        "type_time": mt5.ORDER_TIME_GTC,
    }
    
    result = mt5.order_send(request)
    if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
        error_msg = result.comment if result else mt5.last_error()
        return {"status": "error", "message": f"Execution rejected: {error_msg}"}
        
    return {"status": "success", "ticket": result.order, "price": result.price}

@app.get("/api/telemetry")
def get_live_telemetry():
    default_balance = 542.81
    default_equity = 542.81
    
    if not mt5.initialize():
        return {
            "balance": default_balance, "equity": default_equity,
            "floating_pl": 0.00, "drawdown": 0.00,
            "bridgeStatus": "MT5_OFFLINE", "web3_block": "OFFLINE", "positions": []
        }
    
    acc_info = mt5.account_info()
    if acc_info is None:
        return {
            "balance": default_balance, "equity": default_equity,
            "floating_pl": 0.00, "drawdown": 0.00,
            "bridgeStatus": "NO_ACCOUNT_INFO", "web3_block": "OFFLINE", "positions": []
        }
        
    current_balance = acc_info.balance
    current_equity = acc_info.equity
    floating_pl = round(current_equity - current_balance, 2)
    
    drawdown_pct = 0.00
    if current_balance > 0 and current_equity < current_balance:
        drawdown_pct = round(((current_balance - current_equity) / current_balance) * 100, 2)

    mt5_positions = mt5.positions_get()
    active_positions = []
    
    if mt5_positions:
        for pos in mt5_positions:
            active_positions.append({
                "id": pos.ticket,
                "asset": pos.symbol,
                "type": "BUY" if pos.type == 0 else "SELL",
                "lots": pos.volume,
                "profit": round(pos.profit, 2)
            })

    return {
        "balance": current_balance,
        "equity": current_equity,
        "floating_pl": floating_pl,
        "drawdown": drawdown_pct,
        "bridgeStatus": "HEALTHY",
        "web3_block": "OFFLINE",
        "positions": active_positions
    }