"""
VolSim-Pro Sentiment Service
----------------------------

Purpose:
    Normalize external crowd sentiment into a deterministic structure.

Supported normalized output:

    crowding_percent
    sentiment_score
    direction
    confidence
    source
    timestamp
    stale

Interpretation:

    sentiment_score:
        -1.0 = strongly bearish crowd
         0.0 = neutral
        +1.0 = strongly bullish crowd

    crowding_percent:
        0..100

Important:
    Sentiment DOES NOT directly open a trade.

It is a signal modifier.

The execution layer can later use:

    crowding >= threshold
    AND
    sentiment confidence >= threshold

to modify a strategy signal.

Environment:

    SENTIMENT_ENABLED=true

    SENTIMENT_PROVIDER=generic

    SENTIMENT_URL=
    SENTIMENT_API_KEY=

    SENTIMENT_MAX_STALENESS_SECONDS=300

    SENTIMENT_EXTREME_PERCENT=85
    SENTIMENT_MIN_CONFIDENCE=0.70
"""

from __future__ import annotations

import json
import logging
import os
import time
import urllib.request

from datetime import datetime, timezone
from typing import Any, Dict, Optional


logger = logging.getLogger(
    "volsim.sentiment"
)


class SentimentService:

    def __init__(self) -> None:

        self.enabled = (
            os.getenv(
                "SENTIMENT_ENABLED",
                "true"
            ).strip().lower()
            in ("1", "true", "yes", "on")
        )

        self.provider = os.getenv(
            "SENTIMENT_PROVIDER",
            "generic"
        ).strip().lower()

        self.url = os.getenv(
            "SENTIMENT_URL",
            ""
        ).strip()

        self.api_key = os.getenv(
            "SENTIMENT_API_KEY",
            ""
        ).strip()

        self.max_staleness_seconds = float(
            os.getenv(
                "SENTIMENT_MAX_STALENESS_SECONDS",
                "300"
            )
        )

        self.extreme_percent = float(
            os.getenv(
                "SENTIMENT_EXTREME_PERCENT",
                "85"
            )
        )

        self.min_confidence = float(
            os.getenv(
                "SENTIMENT_MIN_CONFIDENCE",
                "0.70"
            )
        )

        self.timeout_seconds = float(
            os.getenv(
                "SENTIMENT_TIMEOUT_SECONDS",
                "5"
            )
        )

        self._last_data: Optional[
            Dict[str, Any]
        ] = None

        self._last_fetch_timestamp = 0.0

        self._last_error: Optional[str] = None

    # ------------------------------------------------------------
    # Status
    # ------------------------------------------------------------

    def status(self) -> Dict[str, Any]:

        return {
            "enabled": self.enabled,
            "provider": self.provider,
            "configured": bool(self.url),
            "max_staleness_seconds":
                self.max_staleness_seconds,
            "extreme_percent":
                self.extreme_percent,
            "min_confidence":
                self.min_confidence,
            "last_fetch_timestamp":
                self._last_fetch_timestamp,
            "last_error":
                self._last_error,
        }

    # ------------------------------------------------------------
    # Provider
    # ------------------------------------------------------------

    def _fetch(self) -> Dict[str, Any]:

        if not self.url:
            raise RuntimeError(
                "SENTIMENT_URL is not configured."
            )

        headers = {
            "Accept": "application/json",
            "User-Agent": "VolSim-Pro/1.0",
        }

        if self.api_key:
            headers[
                "Authorization"
            ] = (
                f"Bearer {self.api_key}"
            )

        request = urllib.request.Request(
            self.url,
            headers=headers,
            method="GET",
        )

        with urllib.request.urlopen(
            request,
            timeout=self.timeout_seconds,
        ) as response:

            payload = response.read()

        raw = json.loads(
            payload.decode("utf-8")
        )

        if not isinstance(raw, dict):
            raise RuntimeError(
                "Sentiment provider returned "
                "a non-object response."
            )

        return self._normalize(raw)

    # ------------------------------------------------------------
    # Normalization
    # ------------------------------------------------------------

    def _normalize(
        self,
        raw: Dict[str, Any],
    ) -> Dict[str, Any]:

        crowding = raw.get(
            "crowding_percent",
            raw.get(
                "bullish_percent",
                raw.get(
                    "buy_percent"
                )
            )
        )

        bearish = raw.get(
            "bearish_percent",
            raw.get(
                "sell_percent"
            )
        )

        score = raw.get(
            "sentiment_score"
        )

        confidence = raw.get(
            "confidence",
            1.0
        )

        if crowding is None:
            if score is not None:
                score_float = float(score)

                crowding = (
                    50.0
                    + (
                        score_float
                        * 50.0
                    )
                )
            else:
                crowding = 50.0

        crowding = max(
            0.0,
            min(
                100.0,
                float(crowding)
            )
        )

        if score is None:

            score = (
                crowding - 50.0
            ) / 50.0

        score = max(
            -1.0,
            min(
                1.0,
                float(score)
            )
        )

        confidence = max(
            0.0,
            min(
                1.0,
                float(confidence)
            )
        )

        if score > 0.10:
            direction = "BULLISH"
        elif score < -0.10:
            direction = "BEARISH"
        else:
            direction = "NEUTRAL"

        timestamp_value = raw.get(
            "timestamp"
        )

        if timestamp_value is None:
            timestamp_value = time.time()
        else:
            try:
                timestamp_value = float(
                    timestamp_value
                )
            except Exception:
                timestamp_value = time.time()

        return {
            "crowding_percent":
                round(
                    crowding,
                    2
                ),
            "bearish_percent":
                (
                    round(
                        float(bearish),
                        2
                    )
                    if bearish is not None
                    else None
                ),
            "sentiment_score":
                round(
                    score,
                    4
                ),
            "direction":
                direction,
            "confidence":
                round(
                    confidence,
                    4
                ),
            "source":
                self.provider,
            "timestamp":
                timestamp_value,
        }

    # ------------------------------------------------------------
    # Read
    # ------------------------------------------------------------

    def get_sentiment(
        self,
        symbol: Optional[str] = None,
    ) -> Dict[str, Any]:

        if not self.enabled:

            return {
                "enabled": False,
                "available": False,
                "stale": True,
                "reason":
                    "SENTIMENT_DISABLED",
            }

        try:

            data = self._fetch()

            self._last_data = data
            self._last_fetch_timestamp = time.time()
            self._last_error = None

        except Exception as exc:

            self._last_error = str(exc)

            logger.warning(
                "Sentiment fetch failed: %s",
                exc,
            )

            if self._last_data is None:

                return {
                    "enabled": True,
                    "available": False,
                    "stale": True,
                    "reason":
                        "SENTIMENT_UNAVAILABLE",
                    "error": str(exc),
                }

            data = dict(
                self._last_data
            )

        age = (
            time.time()
            - float(
                data.get(
                    "timestamp",
                    self._last_fetch_timestamp
                )
            )
        )

        stale = (
            age
            > self.max_staleness_seconds
        )

        result = dict(data)

        result.update(
            {
                "enabled": True,
                "available": True,
                "stale": stale,
                "age_seconds": round(
                    age,
                    2
                ),
                "symbol": symbol,
                "reason":
                    (
                        "STALE"
                        if stale
                        else "OK"
                    ),
            }
        )

        return result

    # ------------------------------------------------------------
    # Signal interpretation
    # ------------------------------------------------------------

    def get_signal_modifier(
        self,
        symbol: str,
    ) -> Dict[str, Any]:

        sentiment = self.get_sentiment(
            symbol
        )

        if not sentiment.get(
            "available",
            False
        ):

            return {
                "action":
                    "NO_MODIFIER",
                "reason":
                    "SENTIMENT_UNAVAILABLE",
                "sentiment":
                    sentiment,
            }

        if sentiment.get(
            "stale",
            True
        ):

            return {
                "action":
                    "NO_MODIFIER",
                "reason":
                    "SENTIMENT_STALE",
                "sentiment":
                    sentiment,
            }

        crowding = float(
            sentiment.get(
                "crowding_percent",
                50.0
            )
        )

        confidence = float(
            sentiment.get(
                "confidence",
                0.0
            )
        )

        if confidence < self.min_confidence:

            return {
                "action":
                    "NO_MODIFIER",
                "reason":
                    "LOW_CONFIDENCE",
                "sentiment":
                    sentiment,
            }

        if crowding >= self.extreme_percent:

            return {
                "action":
                    "COUNTER_BIAS",
                "bias":
                    "SHORT",
                "strength":
                    min(
                        1.0,
                        (
                            crowding
                            - 50.0
                        ) / 50.0
                    ),
                "reason":
                    "EXTREME_BULLISH_CROWDING",
                "sentiment":
                    sentiment,
            }

        if crowding <= (
            100.0
            - self.extreme_percent
        ):

            return {
                "action":
                    "COUNTER_BIAS",
                "bias":
                    "LONG",
                "strength":
                    min(
                        1.0,
                        (
                            50.0
                            - crowding
                        ) / 50.0
                    ),
                "reason":
                    "EXTREME_BEARISH_CROWDING",
                "sentiment":
                    sentiment,
            }

        return {
            "action":
                "NO_MODIFIER",
            "reason":
                "NORMAL_CROWDING",
            "sentiment":
                sentiment,
        }


sentiment_service = SentimentService()
