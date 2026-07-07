import time
import datetime
import MetaTrader5 as mt5
from database import SessionLocal, engine
from models import Base, TradeRecord
from sqlalchemy import or_

def init_bridge():
    print("Initializing Database Schemas...")
    Base.metadata.create_all(bind=engine)
    
    print("Connecting to MetaTrader 5 Terminal...")
    if not mt5.initialize():
        print(f"❌ MT5 Terminal initialization failed! Error code: {mt5.last_error()}")
        return False
    
    account_info = mt5.account_info()
    if account_info is not None:
        print(f"🟢 Linked to MT5 Account: {account_info.login} | Company: {account_info.company}")
        print(f"📊 Live Terminal Balance: ${account_info.balance} | Current Equity: ${account_info.equity}")
    return True

def sync_mt5_to_db():
    if not init_bridge():
        return

    print("\n🚀 VOLSIM-PRO MT5 Telemetry Link is online and listening...")
    
    try:
        while True:
            db = SessionLocal()
            try:
                # 1. Fetch current live positions directly from the terminal
                positions = mt5.positions_get()
                active_tickets = []

                if positions is not None and len(positions) > 0:
                    for pos in positions:
                        ticket_str = str(pos.ticket)
                        active_tickets.append(ticket_str)
                        
                        existing = db.query(TradeRecord).filter(
                            TradeRecord.ticket == ticket_str
                        ).first()
                        
                        if not existing:
                            new_position = TradeRecord(
                                ticket=ticket_str,
                                symbol=pos.symbol,
                                volume=float(pos.volume),
                                profit=float(pos.profit),
                                status="OPEN",
                                created_at=datetime.datetime.utcnow()
                            )
                            db.add(new_position)
                            print(f"➕ New live trade detected! Ticket: {ticket_str} | {pos.symbol} {pos.volume} Lots")
                        else:
                            existing.profit = float(pos.profit)
                            existing.volume = float(pos.volume)
                            existing.status = "OPEN"
                    
                    # 2. Sweep away old open database records (including those with NULL tickets)
                    db.query(TradeRecord).filter(
                        TradeRecord.status == "OPEN",
                        or_(
                            TradeRecord.ticket.is_(None),
                            ~TradeRecord.ticket.in_(active_tickets)
                        )
                    ).update({"status": "CLOSED"}, synchronize_session='fetch')
                    
                    db.commit()
                    print(f"🔄 Synced {len(positions)} active MT5 positions to local engine matrix.")
                else:
                    # No active positions on terminal -> close everything down
                    db.query(TradeRecord).filter(TradeRecord.status == "OPEN").update({"status": "CLOSED"})
                    db.commit()
                
            except Exception as ex:
                print(f"⚠️ Worker cycle database exception encountered: {str(ex)}")
                db.rollback()
            finally:
                db.close()
                
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 MT5 Telemetry synchronization loop stopped by operator request.")
    finally:
        mt5.shutdown()

if __name__ == "__main__":
    sync_mt5_to_db()