from collections import defaultdict
import logging

from src.services.mt5_bridge_service import mt5_bridge_service
from src.services.position_service import position_service

logger = logging.getLogger("volsim.portfolio")


class PortfolioService:
    """
    Enterprise Portfolio Service.

    Owns:
      - Balance
      - Equity
      - Floating P/L
      - Realized P/L
      - Exposure
      - Portfolio Allocations
      - Open position aggregation

    Account-level values originate from the MT5 Bridge.

    Position-level values originate from PositionService so that
    PAPER and LIVE execution can propagate through the same portfolio
    aggregation layer.
    """

    def __init__(self, mt5_bridge):
        self.mt5_bridge = mt5_bridge

    def get_portfolio_state(self) -> dict:
        """
        Compatibility adapter for Global Trading State.
        """
        return self.snapshot()

    def _get_positions(self) -> list:
        """
        Return positions from the authoritative PositionService.

        PositionService tracks locally created PAPER positions and
        synchronized LIVE MT5 positions.

        If no local positions exist, fall back to the MT5 bridge
        snapshot so existing LIVE behaviour remains compatible.
        """

        local_snapshot = position_service.snapshot()
        local_positions = local_snapshot.get("open_positions", [])

        if local_positions:
            return local_positions

        mt5_snapshot = self.mt5_bridge.snapshot()
        return mt5_snapshot.get("positions", [])

    def snapshot(self) -> dict:
        """
        Build the portfolio state from account data plus positions.
        """

        mt5 = self.mt5_bridge.snapshot()

        account = mt5.get("account", {})

        balance = float(
            account.get("balance", 0.0)
        )

        base_equity = float(
            account.get("equity", balance)
        )

        margin = float(
            account.get("margin", 0.0)
        )

        free_margin = float(
            account.get("free_margin", 0.0)
        )

        leverage = float(
            account.get("leverage", 100)
        )

        realized_pl = float(
            account.get("realized_pl", 0.0)
        )

        positions = self._get_positions()

        floating_pl = 0.0
        total_exposure = 0.0

        symbol_exposure = defaultdict(float)

        normalized_positions = []

        for position in positions:

            volume = float(
                position.get("volume", 0.0)
            )

            open_price = float(
                position.get(
                    "open_price",
                    position.get("price_open", 0.0)
                )
            )

            current_price = float(
                position.get(
                    "current_price",
                    position.get("price_current", open_price)
                )
            )

            position_pl = float(
                position.get(
                    "floating_pl",
                    position.get("profit", 0.0)
                )
            )

            symbol = position.get(
                "symbol",
                "UNKNOWN"
            )

            exposure = abs(
                volume * current_price
            )

            floating_pl += position_pl

            total_exposure += exposure

            symbol_exposure[symbol] += exposure

            normalized_positions.append(position)

        allocations = {}

        if total_exposure > 0:

            allocations = {
                symbol: round(
                    (
                        exposure
                        / total_exposure
                    ) * 100.0,
                    2
                )
                for symbol, exposure
                in symbol_exposure.items()
            }

        # For locally simulated PAPER positions, derive equity
        # from account balance plus floating P/L.
        #
        # For a LIVE account with no locally tracked positions,
        # this remains compatible with the MT5 account equity.
        if normalized_positions:
            equity = round(
                balance + floating_pl,
                2
            )
        else:
            equity = base_equity

        calculated_free_margin = round(
            equity - margin,
            2
        )

        if normalized_positions:
            free_margin = calculated_free_margin

        return {
            "balance": balance,

            "equity": equity,

            "margin": margin,

            "free_margin": free_margin,

            "leverage": leverage,

            "floating_pl": round(
                floating_pl,
                2
            ),

            "realized_pl": round(
                realized_pl,
                2
            ),

            "exposure": round(
                total_exposure,
                2
            ),

            "allocations": allocations,

            "open_positions": len(
                normalized_positions
            )
        }


portfolio_service = PortfolioService(
    mt5_bridge_service
)
