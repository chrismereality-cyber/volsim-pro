
import logging

from src.services.oms_service import oms_service


logger = logging.getLogger("volsim.statistics")


class StatisticsService:
    """
    Enterprise Statistics Engine.

    Owns:
    - trade performance metrics
    - execution statistics
    - win/loss analysis

    Does NOT own:
    - execution
    - risk
    - portfolio aggregation

    Durable history is read from the authoritative trade ledger.
    The OMS remains responsible for live in-memory order lifecycle.
    """

    def __init__(self):
        self.oms = oms_service
        self._durable_closed_trades = []

    async def refresh_durable_history(self):
        """
        Refresh CLOSED trade history from the durable execution ledger.

        This is read-only. It does not modify the database, OMS,
        execution state, positions, broker state, or MT5.
        """
        from src.services.database_service import database_service

        rows = await database_service.fetch(
            """
            SELECT
                trade_id,
                oms_order_id,
                symbol,
                side,
                quantity,
                price,
                status,
                event_type,
                timestamp,
                metadata,
                execution_mode
            FROM trade_ledger
            WHERE status = 'CLOSED'
            ORDER BY timestamp ASC
            """
        )

        durable = []

        for row in rows:
            metadata = row.get("metadata") or {}

            if isinstance(metadata, str):
                try:
                    import json
                    metadata = json.loads(metadata)
                except Exception:
                    metadata = {}

            if not isinstance(metadata, dict):
                metadata = {}

            realized_pl = metadata.get("realized_pl")

            if realized_pl is None:
                realized_pl = metadata.get("profit")

            try:
                realized_pl = float(realized_pl or 0.0)
            except (TypeError, ValueError):
                realized_pl = 0.0

            timestamp = row.get("timestamp")

            if timestamp is not None:
                try:
                    timestamp = timestamp.timestamp()
                except AttributeError:
                    try:
                        timestamp = float(timestamp)
                    except (TypeError, ValueError):
                        timestamp = None

            durable.append(
                {
                    "id": row.get("trade_id"),
                    "trade_id": row.get("trade_id"),
                    "order_id": row.get("oms_order_id"),
                    "oms_order_id": row.get("oms_order_id"),
                    "symbol": row.get("symbol"),
                    "side": row.get("side"),
                    "volume": float(row.get("quantity") or 0.0),
                    "price": float(row.get("price") or 0.0),
                    "status": "CLOSED",
                    "profit": realized_pl,
                    "closed_at": timestamp,
                    "filled_at": None,
                    "created_at": None,
                    "execution_mode": row.get("execution_mode"),
                    "source": "durable_ledger",
                }
            )

        deduplicated = {}
        for trade in durable:
            key = trade.get("oms_order_id") or trade.get("trade_id")

            if key is None:
                key = (
                    trade.get("symbol"),
                    trade.get("side"),
                    trade.get("closed_at"),
                )

            deduplicated[str(key)] = trade

        self._durable_closed_trades = list(deduplicated.values())

        logger.info(
            "Durable statistics history refreshed: %s CLOSED trade records",
            len(self._durable_closed_trades),
        )

        return self._durable_closed_trades

    def _merged_completed_trades(self):
        """
        Merge live OMS CLOSED orders with durable CLOSED history.

        Live OMS records remain authoritative for currently running
        process state. Durable ledger records provide historical
        continuity across process restarts.
        """
        live_orders = self.oms.snapshot().get("orders", [])

        completed = [
            order
            for order in live_orders
            if order.get("status") == "CLOSED"
        ]

        matched_durable = set()

        for order in completed:
            live_oms_id = order.get("order_id") or order.get("oms_order_id")
            live_trade_id = order.get("trade_id")

            for index, durable in enumerate(self._durable_closed_trades):
                durable_oms_id = (
                    durable.get("oms_order_id")
                    or durable.get("order_id")
                )
                durable_trade_id = durable.get("trade_id")

                if (
                    live_oms_id is not None
                    and durable_oms_id is not None
                    and str(live_oms_id) == str(durable_oms_id)
                ) or (
                    live_trade_id is not None
                    and durable_trade_id is not None
                    and str(live_trade_id) == str(durable_trade_id)
                ):
                    matched_durable.add(index)
                    break

        for index, durable in enumerate(self._durable_closed_trades):
            if index not in matched_durable:
                completed.append(durable)

        return completed

    def snapshot(self):
        completed = self._merged_completed_trades()

        profits = [
            float(order.get("profit", 0.0) or 0.0)
            for order in completed
        ]

        wins = [p for p in profits if p > 0]
        losses = [abs(p) for p in profits if p < 0]

        trade_count = len(completed)

        win_rate = 0.0
        if trade_count:
            win_rate = (len(wins) / trade_count) * 100

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

        profit_factor = 0.0
        if sum(losses) > 0:
            profit_factor = sum(wins) / sum(losses)

        expectancy = 0.0
        if trade_count:
            expectancy = (
                (win_rate / 100) * average_win
                - ((1 - win_rate / 100) * average_loss)
            )

        total_net_profit = sum(profits)

        import time

        now = time.time()

        day_seconds = 24 * 60 * 60
        week_seconds = 7 * day_seconds
        month_seconds = 30 * day_seconds

        daily_pl = 0.0
        weekly_pl = 0.0
        monthly_pl = 0.0

        durations = []

        for order in completed:
            profit = float(order.get("profit", 0.0) or 0.0)
            closed_at = order.get("closed_at")

            if closed_at is not None:
                try:
                    age = max(0.0, now - float(closed_at))

                    if age <= day_seconds:
                        daily_pl += profit

                    if age <= week_seconds:
                        weekly_pl += profit

                    if age <= month_seconds:
                        monthly_pl += profit
                except (TypeError, ValueError):
                    pass

            opened_at = order.get("filled_at")

            if opened_at is None:
                opened_at = order.get("created_at")

            if opened_at is not None and closed_at is not None:
                try:
                    duration = float(closed_at) - float(opened_at)

                    if duration >= 0:
                        durations.append(duration / 60)
                except (TypeError, ValueError):
                    pass

        avg_duration_minutes = (
            sum(durations) / len(durations)
            if durations
            else 0.0
        )

        risk_reward_ratio = 0.0

        if average_loss > 0:
            risk_reward_ratio = average_win / average_loss

        return {
            "status": "ONLINE",
            "win_rate": round(win_rate, 2),
            "expectancy": round(expectancy, 2),
            "profit_factor": round(profit_factor, 2),
            "sharpe_ratio": 0.0,
            "sortino_ratio": 0.0,
            "recovery_factor": 0.0,
            "average_win": round(average_win, 2),
            "average_loss": round(average_loss, 2),
            "risk_reward_ratio": round(risk_reward_ratio, 2),
            "total_net_profit": round(total_net_profit, 2),
            "daily_pl": round(daily_pl, 2),
            "weekly_pl": round(weekly_pl, 2),
            "monthly_pl": round(monthly_pl, 2),
            "avg_duration_minutes": round(avg_duration_minutes, 2),
            "trade_count": trade_count,
        }
statistics_service = StatisticsService()

