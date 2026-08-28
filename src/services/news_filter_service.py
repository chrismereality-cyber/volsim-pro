"""
VolSim-Pro Advanced News Filter
--------------------------------

Purpose:
    Detect high-impact scheduled economic events and provide a
    deterministic trading-entry block window.

Safety:
    - This service NEVER sends MT5 orders.
    - It ONLY evaluates whether NEW entries should be blocked.
    - Exits and risk-reduction actions are never blocked by this service.
    - Provider/API failures default to fail-closed when configured.

Primary provider:
    Trading Economics Economic Calendar API.

Environment:
    NEWS_FILTER_ENABLED=true
    NEWS_PROVIDER=tradingeconomics
    TRADING_ECONOMICS_API_KEY=YOUR_KEY

    NEWS_IMPORTANCE_MIN=3
    NEWS_PRE_BLOCK_MINUTES=30
    NEWS_POST_BLOCK_MINUTES=30
    NEWS_CACHE_TTL_SECONDS=30

    NEWS_CURRENCIES=USD
    NEWS_SYMBOLS=XAUUSDm,XAUUSD,XAUUSDM

    NEWS_FAIL_CLOSED=true
    NEWS_TIMEOUT_SECONDS=5
"""

from __future__ import annotations

import json
import logging
import os
import threading
import time
import urllib.parse
import urllib.request

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional


logger = logging.getLogger("volsim.news_filter")


@dataclass(frozen=True)
class EconomicEvent:
    calendar_id: str
    event: str
    country: str
    currency: str
    importance: int
    event_time: datetime
    actual: Optional[str] = None
    forecast: Optional[str] = None
    previous: Optional[str] = None


class NewsFilterService:
    """
    Enterprise economic-news execution gate.

    The service is deliberately independent from MT5 execution.

    It answers:

        should_block_entry(symbol)

    while allowing the execution layer to decide what to do with
    that result.

    This prevents news logic from becoming coupled to order_send().
    """

    def __init__(self) -> None:

        self.enabled = (
            os.getenv(
                "NEWS_FILTER_ENABLED",
                "true"
            ).strip().lower()
            in ("1", "true", "yes", "on")
        )

        self.provider = os.getenv(
            "NEWS_PROVIDER",
            "tradingeconomics"
        ).strip().lower()

        self.api_key = os.getenv(
            "TRADING_ECONOMICS_API_KEY",
            ""
        ).strip()

        self.importance_min = int(
            os.getenv(
                "NEWS_IMPORTANCE_MIN",
                "3"
            )
        )

        self.pre_block_minutes = int(
            os.getenv(
                "NEWS_PRE_BLOCK_MINUTES",
                "30"
            )
        )

        self.post_block_minutes = int(
            os.getenv(
                "NEWS_POST_BLOCK_MINUTES",
                "30"
            )
        )

        self.cache_ttl_seconds = int(
            os.getenv(
                "NEWS_CACHE_TTL_SECONDS",
                "30"
            )
        )

        self.timeout_seconds = float(
            os.getenv(
                "NEWS_TIMEOUT_SECONDS",
                "5"
            )
        )

        self.fail_closed = (
            os.getenv(
                "NEWS_FAIL_CLOSED",
                "true"
            ).strip().lower()
            in ("1", "true", "yes", "on")
        )

        self.currencies = {
            item.strip().upper()
            for item in os.getenv(
                "NEWS_CURRENCIES",
                "USD"
            ).split(",")
            if item.strip()
        }

        self.symbols = {
            item.strip().upper()
            for item in os.getenv(
                "NEWS_SYMBOLS",
                "XAUUSDm,XAUUSD,XAUUSDM"
            ).split(",")
            if item.strip()
        }

        self._cache_lock = threading.Lock()
        self._events_cache: List[EconomicEvent] = []
        self._cache_timestamp = 0.0

        self._last_error: Optional[str] = None
        self._last_success_timestamp: Optional[float] = None

    # ------------------------------------------------------------
    # Configuration
    # ------------------------------------------------------------

    def status(self) -> Dict[str, Any]:

        return {
            "enabled": self.enabled,
            "provider": self.provider,
            "importance_min": self.importance_min,
            "pre_block_minutes": self.pre_block_minutes,
            "post_block_minutes": self.post_block_minutes,
            "cache_ttl_seconds": self.cache_ttl_seconds,
            "currencies": sorted(self.currencies),
            "symbols": sorted(self.symbols),
            "fail_closed": self.fail_closed,
            "last_error": self._last_error,
            "last_success_timestamp": self._last_success_timestamp,
            "cached_events": len(self._events_cache),
        }

    # ------------------------------------------------------------
    # HTTP
    # ------------------------------------------------------------

    def _http_get_json(self, url: str) -> Any:

        request = urllib.request.Request(
            url,
            headers={
                "Accept": "application/json",
                "User-Agent": "VolSim-Pro/1.0",
            },
            method="GET",
        )

        with urllib.request.urlopen(
            request,
            timeout=self.timeout_seconds,
        ) as response:

            payload = response.read()

        return json.loads(
            payload.decode("utf-8")
        )

    # ------------------------------------------------------------
    # Provider
    # ------------------------------------------------------------

    def _fetch_tradingeconomics_events(self) -> List[EconomicEvent]:

        if not self.api_key:
            raise RuntimeError(
                "TRADING_ECONOMICS_API_KEY is not configured."
            )

        now = datetime.now(timezone.utc)

        start_date = now.date().isoformat()
        end_date = (
            now.date()
            + timedelta(days=2)
        ).isoformat()

        query = urllib.parse.urlencode(
            {
                "c": self.api_key,
                "importance": self.importance_min,
                "f": "json",
            }
        )

        url = (
            "https://api.tradingeconomics.com/"
            "calendar/country/"
            "united%20states/"
            f"{start_date}/"
            f"{end_date}"
            f"?{query}"
        )

        raw = self._http_get_json(url)

        if not isinstance(raw, list):
            raise RuntimeError(
                "Trading Economics returned an unexpected response."
            )

        events: List[EconomicEvent] = []

        for item in raw:

            if not isinstance(item, dict):
                continue

            importance = int(
                item.get(
                    "Importance",
                    0
                ) or 0
            )

            if importance < self.importance_min:
                continue

            currency = str(
                item.get(
                    "Currency",
                    ""
                ) or ""
            ).upper()

            country = str(
                item.get(
                    "Country",
                    ""
                ) or ""
            )

            # For XAUUSD, USD macro events are especially relevant.
            # Empty currency values are retained only if explicitly
            # configured through country-level filtering.
            if currency and currency not in self.currencies:
                continue

            date_value = item.get("Date")

            if not date_value:
                continue

            event_time = self._parse_event_time(
                str(date_value)
            )

            if event_time is None:
                continue

            events.append(
                EconomicEvent(
                    calendar_id=str(
                        item.get(
                            "CalendarId",
                            ""
                        )
                    ),
                    event=str(
                        item.get(
                            "Event",
                            item.get(
                                "Category",
                                "Unknown"
                            )
                        )
                    ),
                    country=country,
                    currency=currency,
                    importance=importance,
                    event_time=event_time,
                    actual=item.get("Actual"),
                    forecast=item.get("Forecast"),
                    previous=item.get("Previous"),
                )
            )

        events.sort(
            key=lambda event: event.event_time
        )

        return events

    # ------------------------------------------------------------
    # Time handling
    # ------------------------------------------------------------

    @staticmethod
    def _parse_event_time(
        value: str,
    ) -> Optional[datetime]:

        value = value.strip()

        try:

            parsed = datetime.fromisoformat(
                value.replace(
                    "Z",
                    "+00:00"
                )
            )

            if parsed.tzinfo is None:
                parsed = parsed.replace(
                    tzinfo=timezone.utc
                )

            return parsed.astimezone(
                timezone.utc
            )

        except Exception:

            logger.warning(
                "Unable to parse economic event time: %s",
                value,
            )

            return None

    # ------------------------------------------------------------
    # Cache
    # ------------------------------------------------------------

    def _cache_is_valid(self) -> bool:

        return (
            time.time()
            - self._cache_timestamp
            < self.cache_ttl_seconds
        )

    def refresh(self) -> List[EconomicEvent]:

        if not self.enabled:
            return []

        with self._cache_lock:

            if self._cache_is_valid():
                return list(
                    self._events_cache
                )

            try:

                if self.provider == "tradingeconomics":

                    events = (
                        self._fetch_tradingeconomics_events()
                    )

                else:

                    raise RuntimeError(
                        f"Unsupported news provider: "
                        f"{self.provider}"
                    )

                self._events_cache = events
                self._cache_timestamp = time.time()

                self._last_success_timestamp = (
                    self._cache_timestamp
                )

                self._last_error = None

                return list(events)

            except Exception as exc:

                self._last_error = str(exc)

                logger.error(
                    "News provider refresh failed: %s",
                    exc,
                )

                if self.fail_closed:
                    raise

                return list(
                    self._events_cache
                )

    # ------------------------------------------------------------
    # Event matching
    # ------------------------------------------------------------

    def relevant_events(
        self,
        symbol: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> List[EconomicEvent]:

        if not self.enabled:
            return []

        if now is None:
            now = datetime.now(
                timezone.utc
            )

        if now.tzinfo is None:
            now = now.replace(
                tzinfo=timezone.utc
            )

        now = now.astimezone(
            timezone.utc
        )

        normalized_symbol = (
            symbol.upper().strip()
            if symbol
            else None
        )

        events = self.refresh()

        matched: List[EconomicEvent] = []

        for event in events:

            if event.importance < self.importance_min:
                continue

            if (
                event.currency
                and event.currency not in self.currencies
            ):
                continue

            if (
                normalized_symbol
                and self.symbols
                and normalized_symbol not in self.symbols
            ):
                continue

            block_start = (
                event.event_time
                - timedelta(
                    minutes=self.pre_block_minutes
                )
            )

            block_end = (
                event.event_time
                + timedelta(
                    minutes=self.post_block_minutes
                )
            )

            if block_start <= now <= block_end:
                matched.append(event)

        return matched

    # ------------------------------------------------------------
    # Execution decision
    # ------------------------------------------------------------

    def should_block_entry(
        self,
        symbol: str,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:

        if not self.enabled:

            return {
                "blocked": False,
                "reason": "NEWS_FILTER_DISABLED",
                "events": [],
            }

        try:

            events = self.relevant_events(
                symbol=symbol,
                now=now,
            )

            if events:

                return {
                    "blocked": True,
                    "reason": "HIGH_IMPACT_NEWS_WINDOW",
                    "events": [
                        self._event_to_dict(event)
                        for event in events
                    ],
                }

            return {
                "blocked": False,
                "reason": "NO_HIGH_IMPACT_NEWS_WINDOW",
                "events": [],
            }

        except Exception as exc:

            if self.fail_closed:

                return {
                    "blocked": True,
                    "reason": "NEWS_DATA_UNAVAILABLE_FAIL_CLOSED",
                    "error": str(exc),
                    "events": [],
                }

            return {
                "blocked": False,
                "reason": "NEWS_DATA_UNAVAILABLE_FAIL_OPEN",
                "error": str(exc),
                "events": [],
            }

    @staticmethod
    def _event_to_dict(
        event: EconomicEvent,
    ) -> Dict[str, Any]:

        return {
            "calendar_id": event.calendar_id,
            "event": event.event,
            "country": event.country,
            "currency": event.currency,
            "importance": event.importance,
            "event_time": event.event_time.isoformat(),
            "actual": event.actual,
            "forecast": event.forecast,
            "previous": event.previous,
        }


news_filter_service = NewsFilterService()
