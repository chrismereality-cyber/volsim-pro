from collections import defaultdict
import logging
import os

from src.services.mt5_bridge_service import mt5_bridge_service
from src.services.position_service import position_service
from src.services.database_service import database_service
from src.services.mt5_service import mt5_service

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
        self._paper_realized_pl = 0.0

    async def refresh_paper_realized_pl(self) -> float:
        """
        Return cumulative realized P/L for PAPER economic trades.

        PAPER accounting is sourced from the authoritative durable
        trade ledger rather than the live MT5 broker account history.

        Multiple CLOSED ledger events for the same economic trade are
        reduced to the latest event, matching StatisticsService's
        economic-trade semantics.
        """

        rows = await database_service.fetch(
            """
            SELECT DISTINCT ON (trade_id)
                trade_id,
                metadata
            FROM trade_ledger
            WHERE status = 'CLOSED'
              AND execution_mode = 'PAPER'
            ORDER BY
                trade_id,
                timestamp DESC
            """
        )

        total = 0.0

        for row in rows:
            metadata = row.get("metadata") or {}

            if isinstance(metadata, str):
                import json
                metadata = json.loads(metadata)

            realized_pl = float(
                metadata.get("realized_pl", 0.0)
                or 0.0
            )

            total += realized_pl

        self._paper_realized_pl = round(total, 2)

        return self._paper_realized_pl

    def get_portfolio_state(
        self,
        account_state=None,
    ) -> dict:
        """
        Compatibility adapter for Global Trading State.

        An upstream authoritative account snapshot may be supplied to avoid
        reacquiring identical MT5 account data.

        PAPER realized P/L is maintained by the service's durable
        accounting cache and refreshed asynchronously outside snapshot().
        """
        return self.snapshot(
            account_state=account_state,
        )

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

        mt5_snapshot = self.mt5_bridge.snapshot(
            include_market=False,
        )

        return mt5_snapshot.get(
            "positions",
            []
        )

    def snapshot(
        self,
        account_state=None,
    ) -> dict:
        """
        Build the portfolio state from account data plus positions.

        An authoritative upstream account snapshot may be supplied to avoid
        duplicate MT5 account acquisition. Position and market data remain
        independently sourced by the bridge.
        """

        mt5 = self.mt5_bridge.snapshot(
            account_override=account_state,
            include_market=False,
        )

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

        if self._get_execution_mode() == "PAPER":
            realized_pl = float(
                self._paper_realized_pl
            )
        else:
            realized_pl = float(
                account.get("realized_pl", 0.0)
            )

        positions = self._get_positions()

        floating_pl = 0.0
        total_exposure = 0.0

        protected_risk = 0.0
        protected_risk_positions = 0
        protected_risk_missing_positions = 0

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

            # Protected-risk measurement only.
            # Missing or invalid protection is preserved as
            # a data-quality condition; no risk is invented.

            if str(
                position.get(
                    "status",
                    "OPEN"
                )
            ).upper() != "OPEN":
                continue

            stop_loss = float(
                position.get(
                    "stop_loss",
                    0.0
                ) or 0.0
            )

            side = str(
                position.get(
                    "side",
                    position.get("type", "")
                )
                or ""
            ).upper()

            if (
                volume <= 0
                or open_price <= 0
                or stop_loss <= 0
                or side not in {"BUY", "SELL"}
            ):
                protected_risk_missing_positions += 1
                continue

            stop_is_valid = (
                side == "BUY"
                and stop_loss < open_price
            ) or (
                side == "SELL"
                and stop_loss > open_price
            )

            if not stop_is_valid:
                protected_risk_missing_positions += 1
                continue

            execution_context = (
                mt5_service.get_symbol_execution_context(
                    symbol
                )
            )

            if not isinstance(
                execution_context,
                dict
            ):
                protected_risk_missing_positions += 1
                continue

            tick_size = float(
                execution_context.get(
                    "trade_tick_size",
                    0.0
                ) or 0.0
            )

            tick_value = float(
                execution_context.get(
                    "trade_tick_value",
                    0.0
                ) or 0.0
            )

            if tick_size <= 0 or tick_value <= 0:
                protected_risk_missing_positions += 1
                continue

            stop_distance = abs(
                open_price - stop_loss
            )

            estimated_loss = (
                (stop_distance / tick_size)
                * tick_value
                * volume
            )

            if estimated_loss < 0:
                protected_risk_missing_positions += 1
                continue

            protected_risk += estimated_loss
            protected_risk_positions += 1

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
            ),

            "protected_risk": round(
                protected_risk,
                2
            ),

            "protected_risk_percent": round(
                (
                    protected_risk
                    / equity
                ) * 100.0,
                2
            ) if equity > 0 else 0.0,

            "protected_risk_positions": (
                protected_risk_positions
            ),

            "protected_risk_missing_positions": (
                protected_risk_missing_positions
            )
        }


portfolio_service = PortfolioService(
    mt5_bridge_service
)
