from collections import defaultdict
import logging
import os

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

    def _get_execution_mode(self) -> str:
        """
        Return the authoritative VolSim-Pro execution mode.

        PAPER is the mandatory safe default.
        LIVE must be explicitly enabled through the environment.
        """

        configured_mode = os.getenv(
            "VOLSIM_EXECUTION_MODE",
            "PAPER",
        ).strip().upper()

        if configured_mode not in {"PAPER", "LIVE"}:
            logger.warning(
                "Invalid VOLSIM_EXECUTION_MODE=%r; "
                "falling back to PAPER.",
                configured_mode,
            )
            return "PAPER"

        return configured_mode

    def _get_positions(self) -> list:
        """
        Return positions from the authoritative PositionService.

        PAPER mode:
            PositionService is authoritative.
            MT5 positions must never leak into PAPER state.

        LIVE mode:
            PositionService remains authoritative when it contains
            synchronized positions. If none exist, the MT5 bridge
            remains the compatibility fallback.
        """

        execution_mode = self._get_execution_mode()

        local_snapshot = position_service.snapshot()

        local_positions = local_snapshot.get(
            "open_positions",
            [],
        )

        if local_positions:
            return local_positions

        if execution_mode == "PAPER":
            return []

        mt5_snapshot = self.mt5_bridge.snapshot()

        return mt5_snapshot.get(
            "positions",
            []
        )

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

        # ----------------------------------------------------------
        # Mode-aware account state
        # ----------------------------------------------------------
        #
        # PAPER mode:
        #   - MT5 equity must never leak into PAPER risk state.
        #   - Equity is derived from the PAPER balance plus local
        #     floating P/L.
        #   - MT5 margin/free-margin must never leak into PAPER state.
        #
        # LIVE mode:
        #   - Preserve authoritative MT5 account equity/margin when
        #     there are no locally synchronized positions.
        #   - Preserve local position aggregation when positions exist.
        #
        execution_mode = self._get_execution_mode()

        if execution_mode == "PAPER":
            equity = round(
                balance + floating_pl,
                2
            )

            paper_margin = 0.0

            calculated_free_margin = round(
                equity - paper_margin,
                2
            )

            margin = paper_margin
            free_margin = calculated_free_margin

        else:
            if normalized_positions:
                equity = round(
                    balance + floating_pl,
                    2
                )

                calculated_free_margin = round(
                    equity - margin,
                    2
                )

                free_margin = calculated_free_margin

            else:
                equity = base_equity

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
