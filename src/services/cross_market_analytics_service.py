import math
import time
from typing import Any, Dict, Optional

import MetaTrader5 as mt5

from src.services.mt5_service import mt5_service


class CrossMarketAnalyticsService:
    """
    Cross-market historical relationship analytics.

    Scope:
        - XAUUSDm
        - BTCUSDm
        - M5
        - 200 MT5 bars per symbol

    Semantics:
        - The newest returned bar is treated as the currently forming bar.
        - Only completed bars participate in historical analytics.
        - Symbols are aligned by timestamp, never by array position.
        - Missing observations remain missing.
        - No forward-fill or interpolation is performed.

    This service is analytical only.

    It does NOT:
        - make trading decisions
        - authorize execution
        - modify positions
        - access portfolio/risk state
        - place orders
        - call VFIA
        - mutate GlobalTradingStateService
    """

    TIMEFRAME = mt5.TIMEFRAME_M5
    BAR_COUNT = 200

    SYMBOLS = (
        "XAUUSDm",
        "BTCUSDm",
    )

    def __init__(self):
        self.state: Dict[str, Any] = {
            "status": "NOT_EVALUATED",
            "timeframe": "M5",
            "symbols": list(self.SYMBOLS),
            "source_bar_count": self.BAR_COUNT,
            "completed_bar_count": {},
            "synchronized_bar_count": 0,
            "first_timestamp": None,
            "last_timestamp": None,
            "return_observation_count": 0,
            "correlation": None,
            "covariance": None,
            "relative_return": None,
            "data_quality": {},
            "last_update": time.time(),
        }

    @staticmethod
    def _completed_bars(rates):
        if rates is None or len(rates) < 2:
            return []

        # MT5 returns the current forming candle as the newest bar.
        return list(rates[:-1])

    @staticmethod
    def _timestamp(candle) -> int:
        return int(candle["time"])

    @staticmethod
    def _close(candle) -> float:
        return float(candle["close"])

    @staticmethod
    def _returns(candles):
        if len(candles) < 2:
            return {}

        returns = {}

        previous = CrossMarketAnalyticsService._close(candles[0])

        for candle in candles[1:]:
            current = CrossMarketAnalyticsService._close(candle)

            if previous == 0.0:
                previous = current
                continue

            timestamp = CrossMarketAnalyticsService._timestamp(candle)

            returns[timestamp] = (
                current / previous
            ) - 1.0

            previous = current

        return returns

    @staticmethod
    def _mean(values):
        if not values:
            return None

        return sum(values) / len(values)

    @staticmethod
    def _covariance(x_values, y_values):
        if len(x_values) != len(y_values):
            return None

        if len(x_values) < 2:
            return None

        x_mean = sum(x_values) / len(x_values)
        y_mean = sum(y_values) / len(y_values)

        return sum(
            (x - x_mean) * (y - y_mean)
            for x, y in zip(x_values, y_values)
        ) / (len(x_values) - 1)

    @staticmethod
    def _correlation(x_values, y_values):
        if len(x_values) != len(y_values):
            return None

        if len(x_values) < 2:
            return None

        x_mean = sum(x_values) / len(x_values)
        y_mean = sum(y_values) / len(y_values)

        numerator = sum(
            (x - x_mean) * (y - y_mean)
            for x, y in zip(x_values, y_values)
        )

        x_variance = sum(
            (x - x_mean) ** 2
            for x in x_values
        )

        y_variance = sum(
            (y - y_mean) ** 2
            for y in y_values
        )

        denominator = math.sqrt(
            x_variance * y_variance
        )

        if denominator == 0.0:
            return None

        return numerator / denominator

    def evaluate(self):
        if not mt5_service.connect():
            self.state.update({
                "status": "MT5_UNAVAILABLE",
                "last_update": time.time(),
            })

            return self.state

        completed = {}
        source_counts = {}
        completed_counts = {}

        for symbol in self.SYMBOLS:

            rates = mt5.copy_rates_from_pos(
                symbol,
                self.TIMEFRAME,
                0,
                self.BAR_COUNT,
            )

            source_count = (
                len(rates)
                if rates is not None
                else 0
            )

            source_counts[symbol] = source_count

            bars = self._completed_bars(rates)

            completed[symbol] = bars
            completed_counts[symbol] = len(bars)

        if any(
            completed_counts[symbol] < 2
            for symbol in self.SYMBOLS
        ):
            self.state.update({
                "status": "INSUFFICIENT_DATA",
                "source_bar_count": source_counts,
                "completed_bar_count": completed_counts,
                "last_update": time.time(),
            })

            return self.state

        timestamp_sets = {
            symbol: {
                self._timestamp(candle)
                for candle in completed[symbol]
            }
            for symbol in self.SYMBOLS
        }

        common_timestamps = set.intersection(
            *timestamp_sets.values()
        )

        common_timestamps = sorted(
            common_timestamps
        )

        close_maps = {
            symbol: {
                self._timestamp(candle): self._close(candle)
                for candle in completed[symbol]
            }
            for symbol in self.SYMBOLS
        }

        aligned_closes = {
            symbol: [
                close_maps[symbol][timestamp]
                for timestamp in common_timestamps
            ]
            for symbol in self.SYMBOLS
        }

        aligned_bars = len(common_timestamps)

        if aligned_bars < 2:
            self.state.update({
                "status": "INSUFFICIENT_SYNCHRONIZED_DATA",
                "source_bar_count": source_counts,
                "completed_bar_count": completed_counts,
                "synchronized_bar_count": aligned_bars,
                "last_update": time.time(),
            })

            return self.state

        aligned_returns = {
            symbol: []
            for symbol in self.SYMBOLS
        }

        return_timestamps = common_timestamps[1:]

        for symbol in self.SYMBOLS:
            closes = aligned_closes[symbol]

            aligned_returns[symbol] = [
                (
                    closes[index]
                    / closes[index - 1]
                ) - 1.0
                for index in range(1, len(closes))
                if closes[index - 1] != 0.0
            ]

        x_symbol = self.SYMBOLS[0]
        y_symbol = self.SYMBOLS[1]

        x_returns = aligned_returns[x_symbol]
        y_returns = aligned_returns[y_symbol]

        observation_count = min(
            len(x_returns),
            len(y_returns),
        )

        x_returns = x_returns[:observation_count]
        y_returns = y_returns[:observation_count]

        correlation = self._correlation(
            x_returns,
            y_returns,
        )

        covariance = self._covariance(
            x_returns,
            y_returns,
        )

        if observation_count:
            x_cumulative_return = (
                math.prod(
                    1.0 + value
                    for value in x_returns
                )
                - 1.0
            )

            y_cumulative_return = (
                math.prod(
                    1.0 + value
                    for value in y_returns
                )
                - 1.0
            )

            relative_return = (
                x_cumulative_return
                - y_cumulative_return
            )

        else:
            x_cumulative_return = None
            y_cumulative_return = None
            relative_return = None

        data_quality = {
            "timestamp_alignment": "intersection",
            "forming_candle_excluded": True,
            "forward_fill": False,
            "interpolation": False,
            "missing_observations_preserved": True,
            "common_timestamp_count": aligned_bars,
            "return_pair_count": observation_count,
        }

        self.state.update({
            "status": "ONLINE",
            "timeframe": "M5",
            "symbols": list(self.SYMBOLS),
            "source_bar_count": source_counts,
            "completed_bar_count": completed_counts,
            "synchronized_bar_count": aligned_bars,
            "first_timestamp": common_timestamps[0],
            "last_timestamp": common_timestamps[-1],
            "return_observation_count": observation_count,
            "correlation": correlation,
            "covariance": covariance,
            "x_cumulative_return": x_cumulative_return,
            "y_cumulative_return": y_cumulative_return,
            "relative_return": relative_return,
            "data_quality": data_quality,
            "last_update": time.time(),
        })

        return self.state

    def snapshot(self):
        return dict(self.state)


cross_market_analytics_service = (
    CrossMarketAnalyticsService()
)
