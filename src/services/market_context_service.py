from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from src.services.news_filter_service import (
    news_filter_service,
)

from src.services.sentiment_service import (
    sentiment_service,
)


logger = logging.getLogger(
    "volsim.market_context"
)


class MarketContextService:

    def snapshot(
        self,
        symbol: str,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:

        news = (
            news_filter_service.should_block_entry(
                symbol=symbol,
                now=now,
            )
        )

        sentiment = (
            sentiment_service.get_signal_modifier(
                symbol=symbol
            )
        )

        news_blocked = bool(
            news.get(
                "blocked",
                False
            )
        )

        news_reason = news.get(
            "reason",
            "UNKNOWN_NEWS_STATE"
        )

        return {
            "symbol": symbol,

            "news": news,

            "sentiment": sentiment,

            "entry_allowed":
                not news_blocked,

            "risk_reduction_allowed":
                True,

            "exit_allowed":
                True,

            "hedge_allowed":
                True,

            "status":
                (
                    "NEWS_BLOCKED"
                    if news_blocked
                    else "CLEAR"
                ),

            "news_reason":
                news_reason,
        }

    def evaluate_entry(
        self,
        symbol: str,
        strategy_signal: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:

        context = self.snapshot(
            symbol=symbol,
            now=now,
        )

        if not context[
            "entry_allowed"
        ]:

            news = context.get(
                "news",
                {}
            )

            reason = news.get(
                "reason",
                "NEWS_ENTRY_BLOCKED"
            )

            return {
                "allowed": False,

                "reason": reason,

                "original_signal":
                    strategy_signal,

                "effective_signal":
                    None,

                "action":
                    "ENTRY",

                "context":
                    context,
            }

        sentiment = context[
            "sentiment"
        ]

        modifier = sentiment.get(
            "action",
            "NO_MODIFIER"
        )

        bias = sentiment.get(
            "bias"
        )

        effective_signal = (
            strategy_signal
        )

        if (
            modifier == "COUNTER_BIAS"
            and bias
            and strategy_signal
        ):

            signal = (
                str(
                    strategy_signal
                )
                .upper()
                .strip()
            )

            if (
                signal in (
                    "LONG",
                    "BUY"
                )
                and bias == "SHORT"
            ):

                effective_signal = (
                    "SHORT"
                )

            elif (
                signal in (
                    "SHORT",
                    "SELL"
                )
                and bias == "LONG"
            ):

                effective_signal = (
                    "LONG"
                )

        return {
            "allowed": True,

            "reason":
                "ENTRY_ALLOWED",

            "original_signal":
                strategy_signal,

            "effective_signal":
                effective_signal,

            "sentiment_modifier":
                modifier,

            "context":
                context,
        }

    def evaluate_risk_action(
        self,
        symbol: str,
        action: str,
    ) -> Dict[str, Any]:

        normalized = (
            str(
                action
            )
            .upper()
            .strip()
        )

        if normalized in (
            "EXIT",
            "CLOSE",
            "STOP",
            "STOP_LOSS",
            "TAKE_PROFIT",
            "RISK_REDUCTION",
            "REDUCE",
            "HEDGE",
            "EMERGENCY",
        ):

            return {
                "allowed": True,
                "reason":
                    "RISK_ACTION_NOT_BLOCKED",
                "symbol": symbol,
                "action": normalized,
            }

        return {
            "allowed": False,
            "reason":
                "UNKNOWN_RISK_ACTION",
            "symbol": symbol,
            "action": normalized,
        }

    def status(self) -> Dict[str, Any]:

        return {
            "service":
                "MarketContextService",

            "news":
                news_filter_service.status(),

            "sentiment":
                sentiment_service.status(),
        }


market_context_service = (
    MarketContextService()
)
