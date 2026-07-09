from sqlalchemy.exc import OperationalError
import time
import datetime
import MetaTrader5 as mt5
from database import SessionLocal
from models import TradeRecord
from vault_manager import process_live_trade_allocation

def init_bridge():
    if not mt5.initialize():
        print("❌ MT5 Initialization failed!")
        return False
    return True

def sync_mt5_to_db():
    if not init_bridge(): return
    print("\n🚀 VOLSIM-PRO MT5 Telemetry Link Duplex Engine Online [VAULT ENHANCED]...")
    
    while True:
        db = SessionLocal()
        try:
            # 1. Intercept manual dashboard close requests
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
                        print(f"🛑 Closed ticket {ticket_id} via manual dashboard command.")
                pending.status = "CLOSED"
                db.commit()

            # 2. Sync running open trades
            positions = mt5.positions_get()
            active_tickets = []
            if positions:
                for pos in positions:
                    t_str = str(pos.ticket)
                    active_tickets.append(t_str)
                    existing = db.query(TradeRecord).filter(TradeRecord.ticket == t_str).first()
                    if not existing:
                        db.add(TradeRecord(
                            ticket=t_str, symbol=pos.symbol, volume=pos.volume, 
                            profit=pos.profit, status="OPEN", created_at=datetime.datetime.utcnow()
                        ))
                    else:
                        existing.profit = pos.profit
                        existing.status = "OPEN"
                db.commit()

            # 3. Pull historical deals safely
            from_date = datetime.datetime.utcnow() - datetime.timedelta(days=90)
            to_date = datetime.datetime.utcnow() + datetime.timedelta(days=1)
            history_deals = mt5.history_deals_get(from_date, to_date)
            
            account_info = mt5.account_info()
            current_actual_balance = float(account_info.balance) if account_info is not None else 1129.12
            
            if history_deals:
                for deal in history_deals:
                    if deal.entry == mt5.DEAL_ENTRY_OUT and deal.profit != 0:
                        hist_ticket = str(deal.position_id)
                        existing_hist = db.query(TradeRecord).filter(TradeRecord.ticket == hist_ticket).first()
                        
                        extracted_comm = float(deal.commission)
                        extracted_swap = float(deal.swap)
                        extracted_comment = str(deal.comment) if deal.comment else "Manual Execution"
                        
                        # FIX: ONLY trigger vault splitting logic if the trade is NOT already marked CLOSED in our DB
                        if float(deal.profit) > 0 and (not existing_hist or existing_hist.status != "CLOSED"):
                            process_live_trade_allocation(
                                trade_id=hist_ticket,
                                profit=float(deal.profit),
                                current_balance=current_actual_balance
                            )
                        
                        if not existing_hist:
                            db.add(TradeRecord(
                                ticket=hist_ticket, symbol=deal.symbol, volume=deal.volume,
                                profit=deal.profit, commission=extracted_comm, swap=extracted_swap,
                                comment=extracted_comment, status="CLOSED", 
                                created_at=datetime.datetime.fromtimestamp(deal.time)
                            ))
                        else:
                            existing_hist.status = "CLOSED"
                            existing_hist.profit = deal.profit
                            existing_hist.commission = extracted_comm
                            existing_hist.swap = extracted_swap
                            existing_hist.comment = extracted_comment
                db.commit()

            if active_tickets:
                db.query(TradeRecord).filter(
                    TradeRecord.status == "OPEN", 
                    ~TradeRecord.ticket.in_(active_tickets)
                ).update({"status": "CLOSED"}, synchronize_session='fetch')
                db.commit()
                
        except (OperationalError, Exception) as e:
            if "operationalerror" in str(type(e)).lower() or "pooler" in str(e).lower() or "connection" in str(e).lower():
                print(f"⚠️ Telemetry processing exception hit: {e}")
                try: db.close()
                except Exception: pass
                time.sleep(5)
                continue
            else:
                print(f"⚠️ Telemetry processing exception hit: {e}")
                try: db.rollback()
                except Exception: pass
        finally:
            try: db.close()
            except Exception: pass
        time.sleep(2)

if __name__ == "__main__":
    sync_mt5_to_db()