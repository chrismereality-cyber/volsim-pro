import logging
import math
import time

from src.services.database_service import database_service
from src.services.mt5_service import mt5_service
from src.services.oms_service import oms_service

logger = logging.getLogger("volsim.position")


class PositionService:
    """
    Enterprise Position Lifecycle Service.

    Owns:
    - open positions
    - position snapshots
    - market-price synchronization
    - floating P/L tracking
    - close lifecycle preparation

    Does NOT own:
    - execution
    - risk decisions
    - portfolio calculations
    """

    def __init__(self):
        # In-memory state for the running process.
        self.positions = {}

        # Durable recovery state.
        self._recovery_complete = False
        self._recovery_in_progress = False

    async def open_position(
            self,
            trade_id: str,
            order: dict,
            execution: dict
        ):
            """
            Create and register a new open position.

            Identity model:

                oms_order_id
                    |
                    +-- broker order ticket
                    +-- broker deal ticket
                    +-- broker position ticket
                    |
                    +-- local trade_id

            The local trade_id MUST remain unique even in PAPER mode.
            """

            # --------------------------------------------------------------
            # Local position identity
            # --------------------------------------------------------------
            #
            # The caller normally supplies a broker position ticket in LIVE
            # mode. PAPER mode must never use a constant value such as
            # "SIMULATED", otherwise subsequent PAPER trades overwrite the
            # previous position in self.positions.
            #
            if not trade_id or str(trade_id).upper() == "SIMULATED":
                import uuid
                trade_id = str(uuid.uuid4())

            trade_id = str(trade_id)

            position = {
                # ----------------------------------------------------------
                # OMS identity
                # ----------------------------------------------------------

                "oms_order_id": execution.get(
                    "oms_order_id"
                ),

                # ----------------------------------------------------------
                # Local position identity
                # ----------------------------------------------------------

                "trade_id": trade_id,

                # ----------------------------------------------------------
                # Broker identities
                # ----------------------------------------------------------

                "broker_order_ticket": execution.get(
                    "order_ticket"
                ),

                "broker_deal_ticket": execution.get(
                    "deal_ticket"
                ),

                "broker_position_ticket": execution.get(
                    "position_ticket"
                ),

                # ----------------------------------------------------------
                # Original trade intent
                # ----------------------------------------------------------

                "symbol": order.get("symbol"),

                "side": order.get("type"),

                "volume": float(
                    order.get(
                        "volume",
                        0
                    ) or 0
                ),


                "stop_loss": float(
                    order.get(
                        "stop_loss",
                        0
                    ) or 0
                ),

                "take_profit": float(
                    order.get(
                        "take_profit",
                        0
                    ) or 0
                ),
                # ----------------------------------------------------------
                # Pricing
                # ----------------------------------------------------------

                "open_price": float(
                    execution.get(
                        "price",
                        order.get(
                            "price",
                            0
                        )
                    ) or 0
                ),

                "current_price": float(
                    execution.get(
                        "price",
                        order.get(
                            "price",
                            0
                        )
                    ) or 0
                ),

                # ----------------------------------------------------------
                # P/L
                # ----------------------------------------------------------

                "floating_pl": 0.0,

                "realized_pl": 0.0,

                # ----------------------------------------------------------
                # Lifecycle
                # ----------------------------------------------------------

                "status": "OPEN",

                "opened_at": time.time(),

                "closed_at": None,

                "close_price": None,
            }

            self.positions[trade_id] = position

            try:
                await self.persist_snapshot(position)
            except BaseException:
                if self.positions.get(trade_id) is position:
                    self.positions.pop(trade_id, None)
                raise

            logger.info(
                "Position opened: "
                "trade_id=%s "
                "oms_order_id=%s "
                "symbol=%s "
                "side=%s "
                "volume=%s "
                "position_ticket=%s",
                trade_id,
                position.get("oms_order_id"),
                position.get("symbol"),
                position.get("side"),
                position.get("volume"),
                position.get("broker_position_ticket"),
            )

            return position

    async def persist_position(self, position: dict, conn=None):
        """
        Persist the latest durable state of a position.

        The positions table represents CURRENT state.
        position_snapshots represents historical observations.
        """

        trade_id = str(
            position.get(
                "trade_id",
                ""
            )
        )

        if not trade_id:
            raise ValueError(
                "Cannot persist position without trade_id"
            )

        opened_at = position.get("opened_at")

        if opened_at is None:
            opened_at = time.time()

        closed_at = position.get("closed_at")

        execute = (
            conn.execute
            if conn is not None
            else database_service.execute
        )

        await execute(
            """
            INSERT INTO positions
            (
                id,
                trade_id,
                oms_order_id,
                symbol,
                side,
                volume,
                open_price,
                current_price,
                floating_pl,
                realized_pl,
                status,
                execution_mode,
                broker_order_ticket,
                broker_deal_ticket,
                broker_position_ticket,
                opened_at,
                closed_at,
                close_price,
                created_at,
                updated_at
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                $15,
                to_timestamp($16),
                CASE
                    WHEN $17::double precision IS NULL
                    THEN NULL
                    ELSE to_timestamp($17::double precision)
                END,
                $18,
                NOW(),
                NOW()
            )
            ON CONFLICT (trade_id)
            DO UPDATE SET
                oms_order_id =
                    EXCLUDED.oms_order_id,

                symbol =
                    EXCLUDED.symbol,

                side =
                    EXCLUDED.side,

                volume =
                    EXCLUDED.volume,

                open_price =
                    EXCLUDED.open_price,

                current_price =
                    EXCLUDED.current_price,

                floating_pl =
                    EXCLUDED.floating_pl,

                realized_pl =
                    EXCLUDED.realized_pl,

                status =
                    EXCLUDED.status,

                execution_mode =
                    EXCLUDED.execution_mode,

                broker_order_ticket =
                    EXCLUDED.broker_order_ticket,

                broker_deal_ticket =
                    EXCLUDED.broker_deal_ticket,

                broker_position_ticket =
                    EXCLUDED.broker_position_ticket,

                opened_at =
                    EXCLUDED.opened_at,

                closed_at =
                    EXCLUDED.closed_at,

                close_price =
                    EXCLUDED.close_price,

                updated_at =
                    NOW()
            """,

            trade_id,
            trade_id,

            position.get(
                "oms_order_id"
            ),

            position.get(
                "symbol"
            ),

            position.get(
                "side"
            ),

            float(
                position.get(
                    "volume",
                    0.0
                ) or 0.0
            ),

            float(
                position.get(
                    "open_price",
                    0.0
                ) or 0.0
            ),

            float(
                position.get(
                    "current_price",
                    0.0
                ) or 0.0
            ),

            float(
                position.get(
                    "floating_pl",
                    0.0
                ) or 0.0
            ),

            float(
                position.get(
                    "realized_pl",
                    0.0
                ) or 0.0
            ),

            position.get(
                "status",
                "OPEN"
            ),

            position.get(
                "execution_mode",
                "PAPER"
            ),

            position.get(
                "broker_order_ticket"
            ),

            position.get(
                "broker_deal_ticket"
            ),

            position.get(
                "broker_position_ticket"
            ),

            float(opened_at),

            (
                float(closed_at)
                if closed_at is not None
                else None
            ),

            (
                float(
                    position.get(
                        "close_price"
                    )
                )
                if position.get(
                    "close_price"
                ) is not None
                else None
            ),
        )

        logger.info(
            "Durable position state persisted: "
            "trade_id=%s status=%s",
            trade_id,
            position.get("status")
        )

        return position


    async def persist_snapshot(
        self,
        position: dict
    ):
        """
        Persist current durable state plus an
        append-only historical snapshot.
        """

        position_id = str(
            position.get(
                "trade_id",
                "UNKNOWN"
            )
        )

        price = float(
            position.get(
                "current_price",
                position.get(
                    "open_price",
                    0
                )
            )
        )

        pnl = float(
            position.get(
                "floating_pl",
                0.0
            )
        )

        # --------------------------------------------------------
        # CURRENT STATE AND HISTORICAL SNAPSHOT
        # --------------------------------------------------------

        async with database_service.transaction() as conn:
            await self.persist_position(
                position,
                conn=conn,
            )

            await conn.execute(
                """
                INSERT INTO position_snapshots
            (
                id,
                position_id,
                price,
                pnl,
                created_at
            )
            VALUES
            (
                gen_random_uuid(),
                $1,
                $2,
                $3,
                NOW()
            )
                """,
                position_id,
                price,
                pnl
            )

        logger.info(
            "Position snapshot persisted: "
            "position_id=%s price=%s pnl=%s",
            position_id,
            price,
            pnl
        )

        return position


    async def recover_from_database(self):
        """
        Recover OPEN positions from PostgreSQL.

        This method is completely read-only with respect
        to MT5. It does not call order_send(), order_check(),
        or any broker execution operation.
        """

        if self._recovery_complete:
            return self.snapshot()

        if self._recovery_in_progress:
            return self.snapshot()

        self._recovery_in_progress = True

        try:

            rows = await database_service.fetch(
                """
                SELECT
                    id,
                    trade_id,
                    oms_order_id,
                    symbol,
                    side,
                    volume,
                    open_price,
                    current_price,
                    floating_pl,
                    realized_pl,
                    status,
                    execution_mode,
                    broker_order_ticket,
                    broker_deal_ticket,
                    broker_position_ticket,
                    EXTRACT(
                        EPOCH FROM opened_at
                    ) AS opened_at,
                    EXTRACT(
                        EPOCH FROM closed_at
                    ) AS closed_at,
                    close_price
                FROM positions
                WHERE status = 'OPEN'
                ORDER BY updated_at ASC
                """
            )

            recovered = 0

            for row in rows:

                position = {
                    "id": str(
                        row["id"]
                    ),

                    "trade_id": str(
                        row["trade_id"]
                    ),

                    "oms_order_id":
                        row["oms_order_id"],

                    "symbol":
                        row["symbol"],

                    "side":
                        row["side"],

                    "volume":
                        float(
                            row["volume"] or 0.0
                        ),

                    "open_price":
                        float(
                            row["open_price"] or 0.0
                        ),

                    "current_price":
                        float(
                            row["current_price"]
                            or row["open_price"]
                            or 0.0
                        ),

                    "floating_pl":
                        float(
                            row["floating_pl"] or 0.0
                        ),

                    "realized_pl":
                        float(
                            row["realized_pl"] or 0.0
                        ),

                    "status":
                        row["status"],

                    "execution_mode":
                        row["execution_mode"]
                        or "PAPER",

                    "broker_order_ticket":
                        row["broker_order_ticket"],

                    "broker_deal_ticket":
                        row["broker_deal_ticket"],

                    "broker_position_ticket":
                        row[
                            "broker_position_ticket"
                        ],

                    "opened_at":
                        (
                            float(
                                row["opened_at"]
                            )
                            if row["opened_at"]
                            is not None
                            else None
                        ),

                    "closed_at":
                        (
                            float(
                                row["closed_at"]
                            )
                            if row["closed_at"]
                            is not None
                            else None
                        ),

                    "close_price":
                        (
                            float(
                                row["close_price"]
                            )
                            if row["close_price"]
                            is not None
                            else None
                        ),
                }

                self.positions[
                    position["trade_id"]
                ] = position

                recovered += 1

            self._recovery_complete = True

            logger.info(
                "Position database recovery complete: "
                "recovered=%s",
                recovered
            )

            return self.snapshot()

        except Exception as e:

            logger.exception(
                "Position database recovery failed: %s",
                e
            )

            raise

        finally:

            self._recovery_in_progress = False


    def update_price(
        self,
        trade_id: str,
        price: float
    ):
        position = self.positions.get(trade_id)

        if not position:
            return None

        price = float(price)

        position["current_price"] = price

        direction = 1.0

        if position["side"] == "SELL":
            direction = -1.0

        position["floating_pl"] = round(
            (
                price
                - position["open_price"]
            )
            * position["volume"]
            * direction,
            2
        )

        return position

    def update_symbol_price(
        self,
        symbol: str,
        price: float
    ):
        """
        Update every open position for a symbol.
        """

        updated = []

        for trade_id, position in self.positions.items():

            if position.get("status") != "OPEN":
                continue

            if position.get("symbol") != symbol:
                continue

            result = self.update_price(
                trade_id,
                price
            )

            if result:
                updated.append(result)

        return updated

    def sync_market_prices(
        self,
        market: dict
    ):
        """
        Synchronize PositionService with a market snapshot.

        Expected market format:

        {
            "XAUUSDm": {
                "bid": ...,
                "ask": ...,
                "last": ...
            }
        }
        """

        updated = []

        for symbol, quote in market.items():

            if not quote:
                continue

            bid = float(
                quote.get("bid", 0.0)
            )

            ask = float(
                quote.get("ask", 0.0)
            )

            last = float(
                quote.get("last", 0.0)
            )

            for trade_id, position in self.positions.items():

                if position.get("status") != "OPEN":
                    continue

                if position.get("symbol") != symbol:
                    continue

                if position.get("side") == "BUY":

                    price = (
                        bid
                        if bid > 0
                        else last
                    )

                else:

                    price = (
                        ask
                        if ask > 0
                        else last
                    )

                if price <= 0:
                    continue

                result = self.update_price(
                    trade_id,
                    price
                )

                if result:
                    updated.append(result)

        return updated

    async def sync_from_mt5(self):
        """
        Reconcile authoritative LIVE broker positions into local state.

        This method is READ-ONLY with respect to MT5 trading operations.

        Reconciliation rules:
            - Broker OPEN + local missing:
                import and persist the broker position.
            - Broker OPEN + local OPEN:
                synchronize broker-authoritative values.
            - Local OPEN + broker missing:
                flag a reconciliation discrepancy; do NOT fabricate a close.
            - Successful broker query with zero positions:
                valid zero-position snapshot.
            - Broker query failure:
                abort reconciliation without changing local positions.
            - Malformed broker position:
                abort reconciliation rather than treating it as absent.

        This method MUST NOT:
            - call mt5.order_send()
            - call mt5.order_check()
            - open broker positions
            - close broker positions
            - fabricate realized P/L
        """

        try:
            broker_result = (
                mt5_service.get_positions_for_reconciliation()
            )

            if not broker_result.get("success"):
                error = broker_result.get(
                    "error",
                    "Unknown MT5 position query failure",
                )

                logger.error(
                    "MT5 position reconciliation aborted: %s",
                    error,
                )

                return {
                    "status": "BROKER_QUERY_FAILED",
                    "synchronized": [],
                    "discrepancies": [],
                    "error": error,
                }

            broker_positions = broker_result.get(
                "positions",
                [],
            )

            if broker_positions is None:
                error = (
                    "MT5 reconciliation returned "
                    "no position collection"
                )

                logger.error(error)

                return {
                    "status": "BROKER_QUERY_FAILED",
                    "synchronized": [],
                    "discrepancies": [],
                    "error": error,
                }

            # Validate the complete broker snapshot before mutating local state.
            seen_candidate_ids = set()
            for candidate in broker_positions:
                if not isinstance(candidate, dict):
                    error = (
                        "Malformed MT5 broker position: expected dict, "
                        f"got {type(candidate).__name__}"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                candidate_ticket = candidate.get("ticket")
                if candidate_ticket is None:
                    error = "Malformed MT5 broker position: missing position ticket"
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                candidate_id = str(candidate_ticket)
                if candidate_id in seen_candidate_ids:
                    error = (
                        "Malformed MT5 broker snapshot: "
                        f"duplicate position ticket={candidate_id}"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }
                seen_candidate_ids.add(candidate_id)

                raw_timestamp = candidate.get("time")
                if raw_timestamp:
                    if (
                        isinstance(raw_timestamp, bool)
                        or not isinstance(raw_timestamp, (int, float))
                        or not math.isfinite(raw_timestamp)
                        or raw_timestamp < 0
                    ):
                        error = (
                            "Malformed MT5 broker position: "
                            f"ticket={candidate_id} invalid timestamp"
                        )
                        logger.error(error)
                        return {
                            "status": "RECONCILIATION_FAILED",
                            "synchronized": [],
                            "discrepancies": [],
                            "error": error,
                        }
                candidate_symbol = str(candidate.get("symbol", "") or "")
                if not candidate_symbol:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={candidate_id} missing symbol"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                candidate_side = str(candidate.get("type", "") or "")
                if candidate_side not in {"BUY", "SELL"}:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={candidate_id} invalid side={candidate_side!r}"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                try:
                    candidate_volume = float(candidate.get("volume", 0.0) or 0.0)
                    candidate_open = float(candidate.get("price_open", 0.0) or 0.0)
                    candidate_current = float(
                        candidate.get("price_current", candidate_open) or candidate_open
                    )
                    candidate_profit = float(candidate.get("profit", 0.0) or 0.0)
                except (TypeError, ValueError, OverflowError) as exc:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={candidate_id} invalid numeric field ({exc})"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                numeric_values = {
                    "volume": candidate_volume,
                    "price_open": candidate_open,
                    "price_current": candidate_current,
                    "profit": candidate_profit,
                }
                invalid_numeric = next(
                    (
                        field
                        for field, value in numeric_values.items()
                        if not math.isfinite(value)
                    ),
                    None,
                )
                if invalid_numeric is not None:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={candidate_id} non-finite {invalid_numeric}"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                if candidate_volume <= 0.0:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={candidate_id} invalid volume={candidate_volume}"
                    )
                    logger.error(error)
                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

            synchronized = []
            discrepancies = []
            broker_trade_ids = set()

            for broker_position in broker_positions:

                if not isinstance(broker_position, dict):
                    error = (
                        "Malformed MT5 broker position: "
                        f"expected dict, got "
                        f"{type(broker_position).__name__}"
                    )

                    logger.error(error)

                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                broker_position_ticket = broker_position.get(
                    "ticket"
                )

                if broker_position_ticket is None:
                    error = (
                        "Malformed MT5 broker position: "
                        "missing position ticket"
                    )

                    logger.error(error)

                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                trade_id = str(
                    broker_position_ticket
                )

                broker_trade_ids.add(trade_id)

                symbol = str(
                    broker_position.get(
                        "symbol",
                        "",
                    )
                    or ""
                )

                if not symbol:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={trade_id} missing symbol"
                    )

                    logger.error(error)

                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                volume = float(
                    broker_position.get(
                        "volume",
                        0.0,
                    )
                    or 0.0
                )

                price_open = float(
                    broker_position.get(
                        "price_open",
                        0.0,
                    )
                    or 0.0
                )

                price_current = float(
                    broker_position.get(
                        "price_current",
                        price_open,
                    )
                    or price_open
                )

                profit = float(
                    broker_position.get(
                        "profit",
                        0.0,
                    )
                    or 0.0
                )

                side = str(
                    broker_position.get(
                        "type",
                        "",
                    )
                    or ""
                )

                if side not in {"BUY", "SELL"}:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={trade_id} invalid side={side!r}"
                    )

                    logger.error(error)

                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                if volume <= 0.0:
                    error = (
                        "Malformed MT5 broker position: "
                        f"ticket={trade_id} invalid volume={volume}"
                    )

                    logger.error(error)

                    return {
                        "status": "RECONCILIATION_FAILED",
                        "synchronized": [],
                        "discrepancies": [],
                        "error": error,
                    }

                existing = self.positions.get(
                    trade_id
                )

                if existing is None:
                    candidate_position = {
                        "oms_order_id": None,
                        "trade_id": trade_id,
                        "broker_order_ticket": None,
                        "broker_deal_ticket": None,
                        "broker_position_ticket": broker_position_ticket,
                        "symbol": symbol,
                        "side": side,
                        "volume": volume,
                        "open_price": price_open,
                        "current_price": price_current,
                        "floating_pl": profit,
                        "realized_pl": 0.0,
                        "status": "OPEN",
                        "opened_at": broker_position.get("time") or time.time(),
                        "closed_at": None,
                        "close_price": None,
                    }
                else:
                    candidate_position = existing.copy()
                    candidate_position.update(
                        {
                            "broker_position_ticket": broker_position_ticket,
                            "symbol": symbol,
                            "side": side,
                            "volume": volume,
                            "open_price": price_open,
                            "current_price": price_current,
                            "floating_pl": profit,
                            "status": "OPEN",
                        }
                    )

                # Persist before publishing the candidate to in-memory state.
                # persist_snapshot atomically writes current state and history.
                await self.persist_snapshot(candidate_position)
                self.positions[trade_id] = candidate_position

                synchronized.append(
                    candidate_position.copy()
                )

            for trade_id, position in list(
                self.positions.items()
            ):

                if position.get("status") != "OPEN":
                    continue

                if str(trade_id) in broker_trade_ids:
                    continue

                broker_position_ticket = position.get(
                    "broker_position_ticket"
                )

                if broker_position_ticket is None:
                    discrepancy = {
                        "trade_id": str(trade_id),
                        "symbol": position.get("symbol"),
                        "status": "LOCAL_OPEN_BROKER_MISSING",
                        "broker_position_ticket": None,
                        "close_history_status": "NO_POSITION_TICKET",
                    }

                    discrepancies.append(
                        discrepancy
                    )

                    logger.error(
                        "MT5 reconciliation discrepancy: "
                        "local OPEN position has no broker "
                        "position ticket: trade_id=%s symbol=%s",
                        trade_id,
                        position.get("symbol"),
                    )

                    continue

                close_history = (
                    mt5_service.get_position_close_deals(
                        broker_position_ticket
                    )
                )

                if not close_history.get("success"):
                    discrepancy = {
                        "trade_id": str(trade_id),
                        "symbol": position.get("symbol"),
                        "status": "LOCAL_OPEN_BROKER_MISSING",
                        "broker_position_ticket": (
                            broker_position_ticket
                        ),
                        "close_history_status": "QUERY_FAILED",
                        "close_history_error": (
                            close_history.get("error")
                        ),
                    }

                    discrepancies.append(
                        discrepancy
                    )

                    logger.error(
                        "MT5 close-history query failed: "
                        "trade_id=%s symbol=%s ticket=%s error=%s",
                        trade_id,
                        position.get("symbol"),
                        broker_position_ticket,
                        close_history.get("error"),
                    )

                    continue

                closing_deals = (
                    close_history.get("deals") or []
                )

                if not closing_deals:
                    discrepancy = {
                        "trade_id": str(trade_id),
                        "symbol": position.get("symbol"),
                        "status": "LOCAL_OPEN_BROKER_MISSING",
                        "broker_position_ticket": (
                            broker_position_ticket
                        ),
                        "close_history_status": "NO_CLOSING_DEAL",
                    }

                    discrepancies.append(
                        discrepancy
                    )

                    logger.error(
                        "MT5 reconciliation discrepancy: "
                        "broker position missing but no closing "
                        "deal found: trade_id=%s symbol=%s ticket=%s",
                        trade_id,
                        position.get("symbol"),
                        broker_position_ticket,
                    )

                    continue

                valid_closing_deals = []

                for deal in closing_deals:
                    deal_position_id = deal.get(
                        "position_id"
                    )

                    deal_price = float(
                        deal.get("price", 0.0) or 0.0
                    )

                    if (
                        deal_position_id is not None
                        and str(deal_position_id)
                        == str(broker_position_ticket)
                        and deal_price > 0
                    ):
                        valid_closing_deals.append(
                            deal
                        )

                if not valid_closing_deals:
                    discrepancy = {
                        "trade_id": str(trade_id),
                        "symbol": position.get("symbol"),
                        "status": "LOCAL_OPEN_BROKER_MISSING",
                        "broker_position_ticket": (
                            broker_position_ticket
                        ),
                        "close_history_status": (
                            "INVALID_CLOSING_DEAL"
                        ),
                    }

                    discrepancies.append(
                        discrepancy
                    )

                    logger.error(
                        "MT5 reconciliation discrepancy: "
                        "closing history contained no valid "
                        "position-matched closing deal: "
                        "trade_id=%s symbol=%s ticket=%s",
                        trade_id,
                        position.get("symbol"),
                        broker_position_ticket,
                    )

                    continue

                realized_pl = sum(
                    float(deal.get("profit", 0.0) or 0.0)
                    + float(deal.get("swap", 0.0) or 0.0)
                    + float(deal.get("commission", 0.0) or 0.0)
                    for deal in valid_closing_deals
                )

                latest_close_deal = max(
                    valid_closing_deals,
                    key=lambda deal: float(
                        deal.get("time", 0) or 0
                    ),
                )

                close_price = float(
                    latest_close_deal.get("price", 0.0)
                )

                closed_at = float(
                    latest_close_deal.get("time", 0)
                    or time.time()
                )

                broker_deal_ticket = (
                    latest_close_deal.get("ticket")
                )

                broker_order_ticket = (
                    latest_close_deal.get("order")
                )

                # Prepare a candidate without mutating the live position.
                candidate_position = position.copy()
                candidate_position["broker_position_ticket"] = (
                    broker_position_ticket
                )
                candidate_position["broker_deal_ticket"] = (
                    broker_deal_ticket
                )

                if broker_order_ticket is not None:
                    candidate_position["broker_order_ticket"] = (
                        broker_order_ticket
                    )

                candidate_position["close_price"] = close_price
                candidate_position["realized_pl"] = realized_pl
                candidate_position["floating_pl"] = 0.0
                candidate_position["current_price"] = close_price
                candidate_position["status"] = "CLOSED"
                candidate_position["closed_at"] = closed_at

                # The broker is already closed; persist the confirmed close
                # before changing local position or OMS lifecycle state.
                await self.persist_snapshot(candidate_position)
                self.positions[trade_id] = candidate_position

                # Bridge to OMS only after durable position persistence.
                oms_order_id = candidate_position.get("oms_order_id")

                if oms_order_id:
                    lookup_error = None
                    try:
                        oms_order = oms_service.get_order(oms_order_id)
                    except Exception as oms_exc:
                        oms_order = None
                        lookup_error = str(oms_exc)
                        logger.exception(
                            "OMS close bridge lookup failed: "
                            "trade_id=%s oms_order_id=%s",
                            trade_id,
                            oms_order_id,
                        )

                    if oms_order is None:
                        bridge_error = (
                            lookup_error
                            or f"OMS order not found: {oms_order_id}"
                        )
                        discrepancies.append({
                            "trade_id": str(trade_id),
                            "symbol": candidate_position.get("symbol"),
                            "status": "OMS_CLOSE_BRIDGE_FAILED",
                            "oms_order_id": oms_order_id,
                            "error": bridge_error,
                        })
                        logger.error(
                            "OMS close bridge failed: "
                            "trade_id=%s oms_order_id=%s",
                            trade_id,
                            oms_order_id,
                        )
                    else:
                        oms_close_result = {
                            "success": True,
                            "oms_order_id": oms_order_id,
                            "trade_id": str(trade_id),
                            "position_ticket": broker_position_ticket,
                            "order_ticket": broker_order_ticket,
                            "deal_ticket": broker_deal_ticket,
                            "close_price": close_price,
                            "realized_pl": realized_pl,
                        }

                        try:
                            oms_service.update_status(
                                oms_order_id,
                                "CLOSED",
                                oms_close_result,
                            )
                        except Exception as oms_exc:
                            discrepancies.append({
                                "trade_id": str(trade_id),
                                "symbol": candidate_position.get("symbol"),
                                "status": "OMS_CLOSE_BRIDGE_FAILED",
                                "oms_order_id": oms_order_id,
                                "error": str(oms_exc),
                            })
                            logger.exception(
                                "OMS close bridge update failed: "
                                "trade_id=%s oms_order_id=%s",
                                trade_id,
                                oms_order_id,
                            )
                        else:
                            logger.info(
                                "OMS close bridged: "
                                "trade_id=%s oms_order_id=%s "
                                "realized_pl=%.2f close_price=%.5f",
                                trade_id,
                                oms_order_id,
                                realized_pl,
                                close_price,
                            )

                else:
                    logger.error(
                        "OMS close bridge skipped: "
                        "position has no oms_order_id: "
                        "trade_id=%s symbol=%s",
                        trade_id,
                        candidate_position.get("symbol"),
                    )

                synchronized.append(
                    candidate_position.copy()
                )

                logger.info(
                    "MT5 broker close reconciled: "
                    "trade_id=%s symbol=%s ticket=%s "
                    "realized_pl=%.2f close_price=%.5f",
                    trade_id,
                    candidate_position.get("symbol"),
                    broker_position_ticket,
                    realized_pl,
                    close_price,
                )

            return {
                "status": (
                    "RECONCILED"
                    if not discrepancies
                    else "RECONCILED_WITH_DISCREPANCIES"
                ),
                "synchronized": synchronized,
                "discrepancies": discrepancies,
                "error": None,
            }

        except Exception as exc:
            logger.exception(
                "MT5 position reconciliation failed: %s",
                exc,
            )

            return {
                "status": "RECONCILIATION_FAILED",
                "synchronized": synchronized,
                "discrepancies": discrepancies,
                "error": str(exc),
            }

    async def close_position(
        self,
        trade_id: str,
        close_price: float
    ):
        """
        Close an open position and convert floating P/L
        into realized P/L.

        Position lifecycle:

            OPEN
              ?
            PRICE UPDATE
              ?
            FLOATING P/L
              ?
            CLOSE
              ?
            REALIZED P/L
              ?
            CLOSED

        The final position state is persisted through the
        existing snapshot persistence boundary.
        """

        position = self.positions.get(trade_id)

        if not position:
            logger.warning(
                "Cannot close unknown position: %s",
                trade_id
            )
            return None

        if position.get("status") != "OPEN":
            logger.warning(
                "Cannot close non-open position: "
                "trade_id=%s status=%s",
                trade_id,
                position.get("status")
            )
            return position

        close_price = float(close_price)

        if close_price <= 0:
            logger.warning(
                "Invalid close price: "
                "trade_id=%s price=%s",
                trade_id,
                close_price
            )
            return None

        # Recalculate floating P/L at the exact close price.
        position = self.update_price(
            trade_id,
            close_price
        )

        if not position:
            return None

        # Convert the final floating P/L into realized P/L.
        realized_pl = float(
            position.get(
                "floating_pl",
                0.0
            )
        )

        position["close_price"] = close_price
        position["realized_pl"] = realized_pl
        position["floating_pl"] = 0.0
        position["status"] = "CLOSED"
        position["closed_at"] = time.time()

        # Persist the terminal position state.
        await self.persist_snapshot(position)

        logger.info(
            "Position closed: "
            "trade_id=%s "
            "symbol=%s "
            "side=%s "
            "volume=%s "
            "close_price=%s "
            "realized_pl=%s",
            trade_id,
            position.get("symbol"),
            position.get("side"),
            position.get("volume"),
            close_price,
            realized_pl
        )

        return position

    def snapshot(self):

        open_positions = [
            position
            for position in self.positions.values()
            if position.get("status") == "OPEN"
        ]

        return {
            "open_positions": open_positions,
            "count": len(open_positions),
            "recovery_complete":
                self._recovery_complete
        }


position_service = PositionService()

