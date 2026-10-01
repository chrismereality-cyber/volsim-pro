from __future__ import annotations

import json
import logging
from typing import Any

from src.services.database_service import database_service


logger = logging.getLogger("volsim.edge_measurement")


class EdgeMeasurementService:
    """
    Read-only research dataset for AI entry-context attribution.

    This service does not:
    - execute trades
    - authorize trades
    - modify risk
    - modify statistics
    - modify the database

    It joins immutable entry attribution with durable CLOSED
    economic outcomes by trade_id.
    """

    @staticmethod
    def _calculate_metrics(trades: list[dict[str, Any]]) -> dict[str, Any]:
        profits = [
            float(trade.get("realized_pl", 0.0) or 0.0)
            for trade in trades
        ]

        wins = [profit for profit in profits if profit > 0]
        losses = [abs(profit) for profit in profits if profit < 0]
        breakeven = [profit for profit in profits if profit == 0]

        trade_count = len(profits)

        win_rate = (
            (len(wins) / trade_count) * 100
            if trade_count
            else 0.0
        )

        average_win = (
            sum(wins) / len(wins)
            if wins
            else 0.0
        )

        average_loss = (
            sum(losses) / len(losses)
            if losses
            else 0.0
        )

        gross_profit = sum(wins)
        gross_loss = sum(losses)

        profit_factor = (
            gross_profit / gross_loss
            if gross_loss > 0
            else 0.0
        )

        expectancy = (
            (win_rate / 100) * average_win
            - ((1 - win_rate / 100) * average_loss)
            if trade_count
            else 0.0
        )

        return {
            "trade_count": trade_count,
            "wins": len(wins),
            "losses": len(losses),
            "breakeven": len(breakeven),
            "win_rate": round(win_rate, 2),
            "average_win": round(average_win, 2),
            "average_loss": round(average_loss, 2),
            "profit_factor": round(profit_factor, 2),
            "expectancy": round(expectancy, 2),
            "total_net_profit": round(sum(profits), 2),
        }

    @staticmethod
    def _group_metrics(
        trades: list[dict[str, Any]],
        field: str,
    ) -> dict[str, dict[str, Any]]:
        groups: dict[str, list[dict[str, Any]]] = {}

        for trade in trades:
            value = trade.get(field)

            if value is None or value == "":
                continue

            key = str(value)
            groups.setdefault(key, []).append(trade)

        return {
            key: EdgeMeasurementService._calculate_metrics(group)
            for key, group in sorted(groups.items())
        }

    async def snapshot(self) -> dict[str, Any]:
        rows = await database_service.fetch(
            """
            SELECT DISTINCT ON (l.trade_id)
                a.trade_id,
                a.decision_id,
                a.symbol,
                a.side,
                a.trend,
                a.regime,
                a.volatility,
                a.confidence,
                a.atr,
                a.rsi,
                a.ema20,
                a.ema50,
                a.ema200,
                a.spread,
                a.entry_timestamp,
                l.timestamp AS close_timestamp,
                l.execution_mode,
                l.metadata
            FROM entry_attribution a
            JOIN trade_ledger l
              ON l.trade_id = a.trade_id
            WHERE l.status = 'CLOSED'
            ORDER BY l.trade_id, l.timestamp DESC
            """
        )

        eligible = []
        excluded_count = 0

        for row in rows:
            trade_id = row.get("trade_id")

            if trade_id is None:
                excluded_count += 1
                continue

            trade_id = str(trade_id)

            metadata = row.get("metadata") or {}

            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except (TypeError, ValueError):
                    metadata = {}

            if not isinstance(metadata, dict):
                metadata = {}

            realized_pl = metadata.get("realized_pl")

            if realized_pl is None:
                excluded_count += 1
                continue

            try:
                realized_pl = float(realized_pl)
            except (TypeError, ValueError):
                excluded_count += 1
                continue

            eligible.append(
                {
                    "trade_id": trade_id,
                    "decision_id": row.get("decision_id"),
                    "symbol": row.get("symbol"),
                    "side": row.get("side"),
                    "trend": row.get("trend"),
                    "regime": row.get("regime"),
                    "volatility": row.get("volatility"),
                    "confidence": row.get("confidence"),
                    "atr": row.get("atr"),
                    "rsi": row.get("rsi"),
                    "ema20": row.get("ema20"),
                    "ema50": row.get("ema50"),
                    "ema200": row.get("ema200"),
                    "spread": row.get("spread"),
                    "entry_timestamp": row.get("entry_timestamp"),
                    "close_timestamp": row.get("close_timestamp"),
                    "realized_pl": realized_pl,
                    "execution_mode": row.get("execution_mode"),
                }
            )

        status = "ONLINE" if eligible else "INSUFFICIENT_DATA"

        metrics = self._calculate_metrics(eligible)

        return {
            "status": status,
            "eligible_trade_count": len(eligible),
            "excluded_trade_count": excluded_count,
            "metrics": metrics,
            "by_symbol": self._group_metrics(eligible, "symbol"),
            "by_regime": self._group_metrics(eligible, "regime"),
            "by_trend": self._group_metrics(eligible, "trend"),
            "by_volatility": self._group_metrics(eligible, "volatility"),
            "trades": eligible,
        }


edge_measurement_service = EdgeMeasurementService()
