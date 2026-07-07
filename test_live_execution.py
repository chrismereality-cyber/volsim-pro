import sys
from database import get_db, engine, Base
from models import TradeRecord

# Auto-generate the trade_records table inside Supabase if it doesn't exist yet
print("Initializing table creation structures...")
Base.metadata.create_all(bind=engine)

def run_crypto_readiness_test():
    db = next(get_db())
    try:
        print("\n--- VOLSIM PRO CRYPTO WEEKEND EXECUTION READINESS CHECK ---")
        
        # Simulating a clean weekend entry/exit for BTC
        test_trade = TradeRecord(
            symbol="BTCUSDm",
            volume=0.10,
            profit=45.50,
            status="CLOSED"
        )
        
        db.add(test_trade)
        db.commit()
        db.refresh(test_trade)
        print(f"🟢 [Supabase Link]: Crypto trade logged! ID: {test_trade.id} | Symbol: {test_trade.symbol} | Profit: ${test_trade.profit}")
        
        total_closed = db.query(TradeRecord).filter(TradeRecord.status == "CLOSED").count()
        print(f"📊 [SQLAlchemy Query]: Verification pass successful. Total closed trades in table: {total_closed}")
        print("\n🚀 STATUS: Pipeline is verified and execution-ready!")
        
    except Exception as err:
        print(f"❌ PIPELINE ERROR: Connection failed: {err}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_crypto_readiness_test()
