import logging
import time

from src.services.database_service import database_service
from src.services.mt5_service import mt5_service

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
        self.positions = {}

    async def open_position(
        self,
        trade_id: str,
        order: dict,
        execution: dict
    ):
        position = {
            "trade_id": trade_id,
            "symbol": order.get("symbol"),
            "side": order.get("type"),
            "volume": float(order.get("volume", 0)),
            "open_price": float(
                execution.get(
                    "price",
                    order.get("price", 0)
                )
            ),
            "current_price": float(
                execution.get(
                    "price",
                    order.get("price", 0)
                )
            ),
            "floating_pl": 0.0,
            "status": "OPEN",
            "opened_at": time.time()
        }

        self.positions[trade_id] = position

        await self.persist_snapshot(position)

        return position

    async def persist_snapshot(self, position: dict):
        """
        Compatibility persistence hook for position lifecycle.

        PAPER positions remain authoritative in PositionService memory.
        This method provides the persistence boundary required by the
        execution pipeline without changing existing behaviour.
        """
        return position

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

    def sync_from_mt5(self):
        """
        Pull current market quotes from MT5 service
        and propagate them into local positions.

        MT5Service exposes get_market_state() as the
        authoritative market-state interface.
        """

        try:

            market = mt5_service.get_market_state()

            return self.sync_market_prices(
                market
            )

        except Exception as e:

            logger.exception(
                "MT5 price synchronization failed: %s",
                e
            )

            return []

    def snapshot(self):

        return {
            "open_positions": [
                position
                for position
                in self.positions.values()
                if position.get("status") == "OPEN"
            ],
            "count": sum(
                1
                for position
                in self.positions.values()
                if position.get("status") == "OPEN"
            )
        }


position_service = PositionService()
