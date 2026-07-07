from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class TradeRecord(Base):
    __tablename__ = "trade_records"

    id = Column(Integer, primary_key=True, index=True)
    ticket = Column(String, unique=True, nullable=True, index=True)
    symbol = Column(String, index=True)
    volume = Column(Float)
    profit = Column(Float)
    status = Column(String, default="OPEN") # OPEN or CLOSED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)