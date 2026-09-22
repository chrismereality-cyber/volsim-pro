from sqlalchemy import Column, Integer, String, Float, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TradeEvent(Base):
    __tablename__ = 'trade_events'
    id = Column(Integer, primary_key=True)
    event_type = Column(String)  # 'ORDER_SENT', 'FILLED', 'REJECTED'
    symbol = Column(String)
    ticket = Column(Integer, nullable=True)
    message = Column(String)
    created_at = Column(DateTime, default=func.now())
