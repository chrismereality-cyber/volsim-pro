import time
import datetime
import MetaTrader5 as mt5
from database import SessionLocal
from models import TradeRecord
from sqlalchemy import or_

def init_bridge():
    if not mt5.initialize():
        print("❌ MT5 Initialization failed!")
        return False
    return True

def sync_mt5_to_db():
    if not init_bridge(): return
    print("\n🚀 VOLSIM-PRO MT5 Telemetry Link Duplex Engine Online...")
    
    while True:
        db = SessionLocal()
        try:
            # 1. Look for pending manual closures sent from the dashboard UI
            pending_closures = db.query(TradeRecord).filter(TradeRecord.status == "PENDING_CLOSE").all()
            for pending in pending_closures:
                ticket_id = int(pending.ticket)
                live_pos = mt5.positions_get(ticket=ticket_id)
                if live_pos:
                    p = live_pos[0]
                    close_request = {
                        "action": mt5.TRADE_ACTION_DEAL,
                        "symbol": p.symbol,
                        "volume": p.volume,
                        "type": mt5.ORDER_TYPE_SELL if p.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY,
                        "position": p.ticket,
                        "price": mt5.symbol_info_tick(p.symbol).bid if p.type == mt5.ORDER_TYPE_BUY else mt5.symbol_info_tick(p.symbol).ask,
                        "deviation": 20,
                        "magic": 999999,
                        "comment": "Dashboard Liquidation",
                        "type_time": mt5.ORDER_TIME_GTC,
                        "type_filling": mt5.ORDER_FILLING_IOC,
                    }
                    res = mt5.order_send(close_request)
                    if res.retcode == mt5.TRADE_RETCODE_DONE:
                        print(f"🛑 Successfully closed ticket {ticket_id} on broker terminal.")
                pending.status = "CLOSED"
                db.commit()

            # 2. Run normal position sync loop
            positions = mt5.positions_get()
            active_tickets = []
            if positions:
                for pos in positions:
                    t_str = str(pos.ticket)
                    active_tickets.append(t_str)
                    existing = db.query(TradeRecord).filter(TradeRecord.ticket == t_str).first()
                    if not existing:
                        db.add(TradeRecord(ticket=t_str, symbol=pos.symbol, volume=pos.volume, profit=pos.profit, status="OPEN", created_at=datetime.datetime.utcnow()))
                    else:
                        existing.profit = pos.profit
                        existing.status = "OPEN"
                
                db.query(TradeRecord).filter(TradeRecord.status == "OPEN", ~TradeRecord.ticket.in_(active_tickets)).update({"status": "CLOSED"}, synchronize_session='fetch')
                db.commit()
            else:
                db.query(TradeRecord).filter(TradeRecord.status == "OPEN").update({"status": "CLOSED"})
                db.commit()
        except Exception as e:
            db.rollback()
        finally:
            db.close()
        time.sleep(1)

if __name__ == "__main__":
    sync_mt5_to_db()