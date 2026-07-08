from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class TradeRecord(Base):
    __tablename__ = "trade_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket = Column(String, unique=True, index=True)
    symbol = Column(String, index=True)
    volume = Column(Float)
    profit = Column(Float)
    commission = Column(Float, default=0.0)
    swap = Column(Float, default=0.0)
    comment = Column(String, nullable=True)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ImmutableVaultState(Base):
    __tablename__ = "immutable_vault_state"

    id = Column(Integer, primary_key=True, index=True)
    trading_equity_balance = Column(Float, default=0.0)
    vault_balance = Column(Float, default=0.0)
    state_hash = Column(String, nullable=True) # Cryptographic signature block column
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)