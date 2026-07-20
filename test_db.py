import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import TradeEvent

# Point to your direct Supabase instance (Port 5432)
DATABASE_URL = "postgresql+asyncpg://postgres.eqvxnfzuinrbwidztrtm:Greedy2026Volsim@aws-1-eu-north-1.pooler.supabase.com:5432/postgres"

async def test_connection():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        new_event = TradeEvent(
            event_type="ORDER_SENT", 
            symbol="EURUSD", 
            message="Test connection successful"
        )
        session.add(new_event)
        await session.commit()
        print("Successfully logged trade event to Supabase via Port 5432.")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
