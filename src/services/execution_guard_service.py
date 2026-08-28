"""
VolSim-Pro Execution Guard
--------------------------

Central pre-execution safety gate.

This service does not execute trades.

Responsibilities:
    - classify execution actions
    - apply market-context policy
    - block unsafe entries
    - permit exits and risk-reduction actions
    - normalize strategy signals

Execution path:

    ExecutionService
        -> ExecutionGuardService
        -> MarketContextService
        -> Risk / OMS
        -> MT5

Sentiment:
    May modify an existing strategy signal.
    Never independently creates an order.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from src.services.market_context_service import (
    market_context_service,
)


class ExecutionGuardService:

    ENTRY_ACTIONS = {
        "ENTRY",
        "OPEN",
        "OPEN_LONG",
        "OPEN_SHORT",
        "BUY",
        "SELL",
    }

    EXIT_ACTIONS = {
        "EXIT",
        "CLOSE",
        "STOP",
        "STOP_LOSS",
        "TAKE_PROFIT",
    }

    RISK_ACTIONS = {
        "HEDGE",
        "REDUCE",
        "RISK_REDUCTION",
        "EMERGENCY",
    }

    SIGNAL_MAP = {
        "OPEN_LONG": "LONG",
        "OPEN_SHORT": "SHORT",
    }

    def evaluate(
        self,
        symbol: str,
        action: str,
        strategy_signal: Optional[str] = None,
    ) -> Dict[str, Any]:

        normalized_action = (
            str(action)
            .upper()
            .strip()
        )

        # ----------------------------------------------------------
        # EXIT
        # ----------------------------------------------------------
        #
        # Exits must remain executable even when market context
        # contains a news block.
        #
        if normalized_action in self.EXIT_ACTIONS:

            return {
                "allowed": True,
                "action": normalized_action,
                "reason": "EXIT_ALWAYS_ALLOWED",
            }

        # ----------------------------------------------------------
        # RISK REDUCTION
        # ----------------------------------------------------------
        #
        # Route risk actions through MarketContextService so that
        # market-context policy remains centralized.
        #
        if normalized_action in self.RISK_ACTIONS:

            result = (
                market_context_service.evaluate_risk_action(
                    symbol=symbol,
                    action=normalized_action,
                )
            )

            result["action"] = normalized_action

            return result

        # ----------------------------------------------------------
        # ENTRY
        # ----------------------------------------------------------
        #
        # Entries are subject to market-context policy.
        #
        if normalized_action in self.ENTRY_ACTIONS:

            effective_strategy_signal = (
                strategy_signal
                or self.SIGNAL_MAP.get(
                    normalized_action,
                    normalized_action,
                )
            )

            effective_strategy_signal = (
                str(
                    effective_strategy_signal
                )
                .upper()
                .strip()
            )

            result = (
                market_context_service.evaluate_entry(
                    symbol=symbol,
                    strategy_signal=(
                        effective_strategy_signal
                    ),
                )
            )

            result["action"] = normalized_action

            return result

        # ----------------------------------------------------------
        # UNKNOWN ACTION
        # ----------------------------------------------------------
        #
        # Fail closed.
        #
        return {
            "allowed": False,
            "action": normalized_action,
            "reason": "UNKNOWN_EXECUTION_ACTION",
        }

    def status(self) -> Dict[str, Any]:

        return {
            "service":
                "ExecutionGuardService",

            "news_and_sentiment":
                market_context_service.status(),
        }


execution_guard_service = (
    ExecutionGuardService()
)
