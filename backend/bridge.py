import time
import requests
import MetaTrader5 as mt5

# CONFIG
RENDER_URL = "https://volsim-pro.onrender.com/api/trade/status"

if not mt5.initialize():
    print("MT5 Connection Failed")
    quit()

print("🚀 TITAN MT5 BRIDGE v5.8.7 ACTIVE [BTC MODE]")

def get_open_positions():
    positions = mt5.positions_get(symbol="BTCUSD")
    if positions is None: return []
    return [{"ticket": p.ticket, "type": p.type, "volume": p.volume, "profit": p.profit} for p in positions]

while True:
    acc = mt5.account_info()
    if acc:
        # 1. Sync Data TO Dashboard
        payload = {
            "account": {
                "equity": str(round(acc.equity, 2)),
                "profit": str(round(acc.profit, 2)),
                "vault": 0 
            },
            "trades": get_open_positions()
        }
        
        try:
            # Syncing current state
            requests.post(RENDER_URL, json=payload)
            
            # 2. Check for PENDING COMMANDS FROM Dashboard
            # (In a full setup, we'd fetch from a /commands endpoint)
            print(f"Synced BTC Equity: ${acc.equity} | Positions: {len(payload['trades'])}")
            
        except Exception as e:
            print(f"Connection Error: {e}")
            
    time.sleep(1) 
