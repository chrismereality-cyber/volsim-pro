from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, ConfigDict, Field


class TradingStateContract(BaseModel):
    """
    Canonical API/WebSocket representation of VolSim-Pro global trading state.

    The GlobalTradingStateService remains the authoritative state producer.
    This model only validates and normalizes the externally exposed contract.

    Legacy single-symbol fields are preserved for frontend compatibility.
    Multi-symbol collections expose the authoritative per-symbol state.
    """

    model_config = ConfigDict(extra="allow")

    timestamp: float

    # Canonical frontend metrics
    balance: float = 0.0
    equity: float = 0.0
    floatingPl: float = 0.0

    currentDrawdown: float = 0.0
    maxDrawdown: float = 0.0

    winRate: float = 0.0
    profitFactor: float = 0.0
    expectancy: float = 0.0
    sharpeRatio: float = 0.0

    totalTrades: int = 0

    positions: Any = Field(default_factory=list)

    riskPerTrade: float = 0.0
    marginUsage: float = 0.0
    liquidationWarning: bool = False

    portfolioValue: float = 0.0
    netExposure: float = 0.0

    valueAtRisk: float = 0.0

    riskStatus: str = "UNKNOWN"

    hedgingSignals: List[Any] = Field(default_factory=list)

    # Global infrastructure
    account: Dict[str, Any] = Field(default_factory=dict)
    market: Dict[str, Any] = Field(default_factory=dict)
    venue_context: Dict[str, Any] = Field(default_factory=dict)

    # Legacy single-symbol aliases.
    # These remain populated for existing frontend consumers.
    market_features: Any = None
    market_regime: Any = None
    trend: Any = None
    counter_trend_execution: Any = None
    ai_decision: Any = None
    ai_execution: Any = None
    execution_risk: Any = None
    order_builder: Any = None
    ai_execution_orchestrator: Any = None

    # Authoritative multi-symbol state.
    symbols: List[str] = Field(default_factory=list)
    symbol_states: Dict[str, Any] = Field(default_factory=dict)
    market_features_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    market_regime_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    trend_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    counter_trend_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    ai_decision_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    ai_execution_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    execution_risk_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    order_builder_by_symbol: Dict[str, Any] = Field(default_factory=dict)
    ai_execution_orchestrator_by_symbol: Dict[str, Any] = Field(
        default_factory=dict
    )

    execution_queue: Any = None
    vault: Dict[str, Any] = Field(default_factory=dict)
    portfolio: Dict[str, Any] = Field(default_factory=dict)
    risk: Dict[str, Any] = Field(default_factory=dict)
    execution: Any = None
    oms: Any = None
    statistics: Dict[str, Any] = Field(default_factory=dict)
    financial_intelligence: Dict[str, Any] = Field(default_factory=dict)
