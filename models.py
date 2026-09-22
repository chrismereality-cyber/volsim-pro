from sqlalchemy import Column, DateTime, Integer, String, func

from database import Base


class TradeEvent(Base):
    __tablename__ = "trade_events"

    id = Column(
        Integer,
        primary_key=True,
    )

    event_type = Column(
        String,
        nullable=True,
    )

    symbol = Column(
        String,
        nullable=True,
    )

    ticket = Column(
        Integer,
        nullable=True,
    )

    message = Column(
        String,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
