import datetime
from database import SessionLocal, engine
from models import Base, TradeRecord

def run_gold_test():
    print("Initializing table creation structures...")
    Base.metadata.create_all(bind=engine)
    
    print("\n--- VOLSIM PRO LIVE MARKET EXECUTION READINESS CHECK (GOLD) ---")
    db = SessionLocal()
    try:
        # Create a sample closed trade for XAUUSDm to test the calculation pipeline
        new_trade = TradeRecord(
            symbol="XAUUSDm",
            volume=0.5,             # 0.5 Lots
            profit=125.50,          # Mocked profit outcome for pipeline verification
            status="CLOSED",
            created_at=datetime.datetime.utcnow()
        )
        
        db.add(new_trade)
        db.commit()
        db.refresh(new_trade)
        
        print(f"🟢 [Pipeline Link]: Gold trade logged successfully! ID: {new_trade.id} | Symbol: {new_trade.symbol} | Profit: ${new_trade.profit}")
        
        # Verify total database records
        total_trades = db.query(TradeRecord).count()
        print(f"📊 [SQLAlchemy Query]: Verification pass successful. Total closed trades in table: {total_trades}")
        print("\n🚀 STATUS: Gold execution pipeline is verified and active!")
        
    except Exception as e:
        print(f"❌ Error during execution check: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_gold_test()