
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
            # Statistics represent economic trades, not individual OMS
            # lifecycle events. A single broker position can produce
            # multiple OMS orders (entry + AI-driven exit) while retaining
            # one authoritative trade_id.
            trade_id = trade.get("trade_id")

            if trade_id is not None:
                key = ("trade", str(trade_id))
            else:
                oms_order_id = trade.get("oms_order_id")

                if oms_order_id is not None:
                    key = ("oms", str(oms_order_id))
                else:
                    key = (
                        "fallback",
                        trade.get("symbol"),
                        trade.get("side"),
                        trade.get("closed_at"),
                    )

            # Ledger rows are ordered by timestamp ASC, so the latest
            # record for an economic trade wins. The closing execution
            # therefore remains the authoritative statistics record.
            deduplicated[key] = trade

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

        # Statistics represent economic trades rather than individual
        # OMS lifecycle events. An entry OMS order and an AI-driven EXIT
        # OMS order may both become CLOSED for the same broker position.
        #
        # The authoritative economic identity is trade_id. For OMS
        # records, trade_id is stored inside execution_result.
        completed_by_identity = {}

        for order in completed:
            execution_result = order.get("execution_result") or {}

            live_trade_id = (
                order.get("trade_id")
                or execution_result.get("trade_id")
            )

            live_oms_id = (
                order.get("order_id")
                or order.get("oms_order_id")
            )

            if live_trade_id is not None:
                identity = ("trade", str(live_trade_id))
            elif live_oms_id is not None:
                identity = ("oms", str(live_oms_id))
            else:
                identity = (
                    "fallback",
                    order.get("symbol"),
                    order.get("side"),
                    order.get("closed_at"),
                )

            existing = completed_by_identity.get(identity)

            if existing is None:
                completed_by_identity[identity] = order
                continue

            # If multiple OMS lifecycle records represent the same
            # economic trade, retain the later CLOSED record. The EXIT
            # lifecycle is therefore preferred over the original entry
            # lifecycle when both carry the same trade_id.
            existing_closed_at = existing.get("closed_at") or 0
            current_closed_at = order.get("closed_at") or 0

            if current_closed_at >= existing_closed_at:
                completed_by_identity[identity] = order

        completed = list(completed_by_identity.values())

        matched_durable = set()

        for order in completed:
            execution_result = order.get("execution_result") or {}

            live_oms_id = (
                order.get("order_id")
                or order.get("oms_order_id")
            )

            live_trade_id = (
                order.get("trade_id")
                or execution_result.get("trade_id")
            )

            for index, durable in enumerate(self._durable_closed_trades):
                durable_oms_id = (
                    durable.get("oms_order_id")
                    or durable.get("order_id")
                )
                durable_trade_id = durable.get("trade_id")

                if (
                    live_trade_id is not None
                    and durable_trade_id is not None
                    and str(live_trade_id) == str(durable_trade_id)
                ) or (
                    live_trade_id is None
                    and live_oms_id is not None
                    and durable_oms_id is not None
                    and str(live_oms_id) == str(durable_oms_id)
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



