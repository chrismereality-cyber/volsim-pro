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
    status = Column(String, default="OPEN") # OPEN, PENDING_CLOSE, CLOSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)