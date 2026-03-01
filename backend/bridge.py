import time
import requests
import MetaTrader5 as mt5

RENDER_URL = "https://volsim-pro.onrender.com/api/trade/status"

if not mt5.initialize():
    print("MT5 Sync Failed")
    quit()

print("🚀 TITAN BRIDGE v5.9.1: VAULT SYNC ACTIVE")

while True:
    acc = mt5.account_info()
    if acc:
        # Get all open BTC positions
        positions = mt5.positions_get(symbol="BTCUSD")
        trade_list = []
        if positions:
            for p in positions:
                trade_list.append({
                    "ticket": p.ticket,
                    "type": p.type,
                    "volume": p.volume,
                    "profit": round(p.profit, 2)
                })

        payload = {
            "account": {
                "equity": str(round(acc.equity, 2)),
                "profit": str(round(acc.profit, 2))
            },
            "trades": trade_list
        }
        
        try:
            requests.post(RENDER_URL, json=payload)
            print(f"Synced Equity: ${acc.equity} | Vault Tracking...")
        except:
            print("Render Offline")
            
    time.sleep(2)
