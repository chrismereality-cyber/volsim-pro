from sqlalchemy import Column, DateTime, Integer, Numeric, String, func

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

class RiskPolicy(Base):
    __tablename__ = "risk_policy"

    id = Column(
        Integer,
        primary_key=True,
    )

    max_daily_drawdown_percent = Column(
        Numeric(10, 4),
        nullable=False,
    )

    risk_per_trade_percent = Column(
        Numeric(10, 4),
        nullable=False,
    )

    max_position_size = Column(
        Numeric(10, 4),
        nullable=False,
    )

    liquidation_drawdown_percent = Column(
        Numeric(10, 4),
        nullable=False,
    )

    liquidation_margin_usage_percent = Column(
        Numeric(10, 4),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False,
    )
