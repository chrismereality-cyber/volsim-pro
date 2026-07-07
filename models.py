from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base

class TradeRecord(Base):
    __tablename__ = "trade_records"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    volume = Column(Float, nullable=False)
    profit = Column(Float, nullable=False)
    status = Column(String, default="CLOSED", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
