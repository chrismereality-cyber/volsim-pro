import time
import requests
import MetaTrader5 as mt5

# --- CONFIG ---
RENDER_URL = "https://volsim-pro.onrender.com/api/trade/status"
HEDGE_THRESHOLD = -2.00  # Hedge if loss exceeds -$2.00
SYMBOL = "BTCUSD"

if not mt5.initialize():
    print("MT5 Initialization Failed")
    quit()

print("🚀 TITAN v5.9.2: HEDGE ENGINE & VAULT SYNC ACTIVE")

def place_hedge_order(order_type, volume):
    """Fires a hedge trade to MetaTrader 5"""
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": SYMBOL,
        "volume": volume,
        "type": order_type,
        "price": mt5.symbol_info_tick(SYMBOL).ask if order_type == mt5.ORDER_TYPE_BUY else mt5.symbol_info_tick(SYMBOL).bid,
        "magic": 123456,
        "comment": "TITAN_HEDGE_LOCK",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    return result

while True:
    acc = mt5.account_info()
    if acc:
        positions = mt5.positions_get(symbol=SYMBOL)
        trade_list = []
        total_profit = 0
        
        if positions:
            for p in positions:
                trade_list.append({
                    "ticket": p.ticket,
                    "type": p.type,
                    "volume": p.volume,
                    "profit": round(p.profit, 2)
                })
                total_profit += p.profit
                
                # --- AUTO-HEDGE LOGIC ---
                if p.profit <= HEDGE_THRESHOLD and "TITAN_HEDGE_LOCK" not in p.comment:
                    hedge_type = mt5.ORDER_TYPE_SELL if p.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
                    print(f"⚠️ THRESHOLD BREACHED: Hedging Ticket #{p.ticket}")
                    place_hedge_order(hedge_type, p.volume)

        payload = {
            "account": {
                "equity": str(round(acc.equity, 2)),
                "profit": str(round(total_profit, 2))
            },
            "trades": trade_list
        }
        
        try:
            requests.post(RENDER_URL, json=payload)
            print(f"BTC Equity: ${acc.equity} | Profit: ${round(total_profit, 2)} | Sync: OK")
        except:
            print("Render Sync Error...")
            
    time.sleep(1) # High-speed sync
