import logging

from src.services.portfolio_service import portfolio_service
from src.services.mt5_service import mt5_service


logger = logging.getLogger("volsim.risk_service")


class RiskEngineService:
    """
    Production Risk Engine Service.

    This service is deliberately below the Global Trading State layer.

    Dependency direction:

        Portfolio / Broker State
                 |
                 v
            Risk Service
                 |
                 v
        Global Trading State

    IMPORTANT:
    This service must NOT import global_trading_state_service.
    The Global Trading State service consumes this service instead.
    """

    MAX_DAILY_DRAWDOWN_PERCENT = 5.0
    RISK_PER_TRADE_PERCENT = 1.0
    MAX_POSITION_SIZE = 2.0

    LIQUIDATION_DRAWDOWN_PERCENT = 10.0
    LIQUIDATION_MARGIN_USAGE_PERCENT = 80.0

    ALLOWED_SYMBOLS = {
        "XAUUSDm",
        "EURUSD",
        "GBPUSD",
    }

    def __init__(self):
        pass

    # ------------------------------------------------------------------
    # Portfolio state
    # ------------------------------------------------------------------

    def _portfolio_snapshot(self):
        """
        Obtain the underlying portfolio state.

        This is intentionally sourced below the Global Trading State
        aggregation layer to prevent circular imports.
        """

        try:
            state = portfolio_service.snapshot()

            if not isinstance(state, dict):
                return {}

            return state

        except Exception as exc:
            logger.error(
                "Unable to obtain portfolio state: %s",
                exc,
            )

            return {}

    # ------------------------------------------------------------------
    # Risk snapshot
    # ------------------------------------------------------------------

    # ------------------------------------------------------------------
    # Broker symbol contract
    # ------------------------------------------------------------------
    def _symbol_contract(self, symbol):
        """
        Obtain the live MT5 broker contract for a symbol.
        Broker constraints are execution boundaries.
        Platform risk limits remain authoritative above them.
        """
        try:
            contract = mt5_service.get_symbol_contract(symbol)
            if not isinstance(contract, dict):
                return {}
            return contract
        except Exception as exc:
            logger.error(
                "Unable to obtain MT5 symbol contract for %s: %s",
                symbol,
                exc,
            )
            return {}

    def snapshot(self):
        """
        Return the authoritative risk calculation inputs.

        The Global Trading State service consumes this snapshot.
        """

        try:
            portfolio = self._portfolio_snapshot()

            balance = float(
                portfolio.get(
                    "balance",
                    0.0,
                ) or 0.0
            )

            equity = float(
                portfolio.get(
                    "equity",
                    0.0,
                ) or 0.0
            )

            margin = float(
                portfolio.get(
                    "margin",
                    0.0,
                ) or 0.0
            )

            exposure = float(
                portfolio.get(
                    "exposure",
                    0.0,
                ) or 0.0
            )

            # ----------------------------------------------------------
            # Current drawdown
            # ----------------------------------------------------------

            if balance > 0:

                current_drawdown = max(
                    0.0,
                    round(
                        (
                            (balance - equity)
                            / balance
                        ) * 100.0,
                        2,
                    ),
                )

            else:

                current_drawdown = 0.0

            # ----------------------------------------------------------
            # Margin usage
            # ----------------------------------------------------------

            if equity > 0:

                margin_usage = round(
                    (margin / equity) * 100.0,
                    2,
                )

            else:

                margin_usage = 0.0

            # ----------------------------------------------------------
            # Dynamic limits
            # ----------------------------------------------------------

            daily_loss_limit = round(
                equity
                * (
                    self.MAX_DAILY_DRAWDOWN_PERCENT
                    / 100.0
                ),
                2,
            )

            risk_per_trade_amount = round(
                equity
                * (
                    self.RISK_PER_TRADE_PERCENT
                    / 100.0
                ),
                2,
            )

            # ----------------------------------------------------------
            # Protection state
            # ----------------------------------------------------------

            circuit_breaker_active = (
                current_drawdown
                >= self.MAX_DAILY_DRAWDOWN_PERCENT
            )

            liquidation_warning = (
                current_drawdown
                >= self.LIQUIDATION_DRAWDOWN_PERCENT
                or
                margin_usage
                >= self.LIQUIDATION_MARGIN_USAGE_PERCENT
            )

            status = (
                "BLOCKED"
                if circuit_breaker_active
                else "ACTIVE"
            )

            return {

                "balance":
                    round(balance, 2),

                "equity":
                    round(equity, 2),

                "exposure":
                    round(exposure, 2),

                "max_daily_drawdown":
                    self.MAX_DAILY_DRAWDOWN_PERCENT,

                "maximum_allowed_drawdown":
                    self.MAX_DAILY_DRAWDOWN_PERCENT,

                "risk_per_trade":
                    self.RISK_PER_TRADE_PERCENT,

                "risk_per_trade_amount":
                    risk_per_trade_amount,

                "max_position_size":
                    self.MAX_POSITION_SIZE,

                "daily_loss_limit":
                    daily_loss_limit,

                "daily_loss_limit_percent":
                    self.MAX_DAILY_DRAWDOWN_PERCENT,

                "current_drawdown":
                    current_drawdown,

                "margin_usage":
                    margin_usage,

                "liquidation_warning":
                    liquidation_warning,

                "circuit_breaker_active":
                    circuit_breaker_active,

                "status":
                    status,

            }

        except Exception as exc:

            logger.exception(
                "Risk snapshot failed"
            )

            return {

                "balance": 0.0,

                "equity": 0.0,

                "exposure": 0.0,

                "max_daily_drawdown":
                    self.MAX_DAILY_DRAWDOWN_PERCENT,

                "maximum_allowed_drawdown":
                    self.MAX_DAILY_DRAWDOWN_PERCENT,

                "risk_per_trade":
                    self.RISK_PER_TRADE_PERCENT,

                "risk_per_trade_amount":
                    0.0,

                "max_position_size":
                    self.MAX_POSITION_SIZE,

                "daily_loss_limit":
                    0.0,

                "daily_loss_limit_percent":
                    self.MAX_DAILY_DRAWDOWN_PERCENT,

                "current_drawdown":
                    0.0,

                "margin_usage":
                    0.0,

                "liquidation_warning":
                    False,

                "circuit_breaker_active":
                    False,

                "status":
                    "ERROR",

                "error":
                    str(exc),

            }

    # ------------------------------------------------------------------
    # Execution gate
    # ------------------------------------------------------------------

    def approve_order(self, order_request: dict):
        """
        Risk gate called by Execution Service.

        This is the final risk approval immediately before execution.
        """

        state = self.snapshot()

        # --------------------------------------------------------------
        # Circuit breaker
        # --------------------------------------------------------------

        if state["circuit_breaker_active"]:

            return {
                "approved": False,
                "reason": "Daily drawdown limit exceeded",
                "risk": state,
            }

        # --------------------------------------------------------------
        # Liquidation protection
        # --------------------------------------------------------------

        if state["liquidation_warning"]:

            return {
                "approved": False,
                "reason": "Liquidation risk active",
                "risk": state,
            }

        # --------------------------------------------------------------
        # Symbol validation
        # --------------------------------------------------------------

        symbol = order_request.get("symbol")

        if not symbol:

            return {
                "approved": False,
                "reason": "Missing symbol",
            }

        if symbol not in self.ALLOWED_SYMBOLS:

            return {
                "approved": False,
                "reason": "Symbol not allowed",
            }

        # --------------------------------------------------------------
        # Volume validation
        # --------------------------------------------------------------
        volume = order_request.get("volume")
        if volume is None:
            return {
                "approved": False,
                "reason": "Missing volume",
            }
        try:
            volume = float(volume)
        except (TypeError, ValueError):
            return {
                "approved": False,
                "reason": "Invalid volume",
            }
        if volume <= 0:
            return {
                "approved": False,
                "reason": "Volume must be greater than zero",
            }
        # --------------------------------------------------------------
        # Live broker contract
        # --------------------------------------------------------------
        contract = self._symbol_contract(symbol)
        if not contract:
            return {
                "approved": False,
                "reason": "Broker symbol contract unavailable",
                "symbol": symbol,
            }
        broker_min = float(
            contract.get(
                "volume_min",
                0.0,
            ) or 0.0
        )
        broker_max = float(
            contract.get(
                "volume_max",
                0.0,
            ) or 0.0
        )
        broker_step = float(
            contract.get(
                "volume_step",
                0.0,
            ) or 0.0
        )
        # --------------------------------------------------------------
        # Broker minimum
        # --------------------------------------------------------------
        if broker_min > 0 and volume < broker_min:
            return {
                "approved": False,
                "reason": "Broker minimum volume violated",
                "requested_volume": volume,
                "broker_volume_min": broker_min,
            }
        # --------------------------------------------------------------
        # Broker maximum
        # --------------------------------------------------------------
        if broker_max > 0 and volume > broker_max:
            return {
                "approved": False,
                "reason": "Broker maximum volume exceeded",
                "requested_volume": volume,
                "broker_volume_max": broker_max,
            }
        # --------------------------------------------------------------
        # Platform risk maximum
        #
        # The platform risk ceiling remains stricter than the
        # broker's maximum where applicable.
        # --------------------------------------------------------------
        if volume > self.MAX_POSITION_SIZE:
            return {
                "approved": False,
                "reason": "Maximum position size exceeded",
                "requested_volume": volume,
                "maximum_position_size":
                    self.MAX_POSITION_SIZE,
                "broker_volume_max":
                    broker_max,
            }
        # --------------------------------------------------------------
        # Broker volume-step validation
        # --------------------------------------------------------------
        if broker_step > 0:
            step_ratio = volume / broker_step
            nearest_step = round(step_ratio)
            if abs(step_ratio - nearest_step) > 1e-9:
                return {
                    "approved": False,
                    "reason": "Volume does not match broker volume step",
                    "requested_volume": volume,
                    "broker_volume_step": broker_step,
                }
        # --------------------------------------------------------------
        # Approval
        # --------------------------------------------------------------

        return {

            "approved":
                True,

            "reason":
                "Risk limits acceptable",

            "risk_score":
                0,

            "checks": {

                "drawdown":
                    "PASS",

                "liquidation":
                    "PASS",

                "symbol":
                    "PASS",

                "volume":
                    "PASS",

            },

            "risk":
                state,

        }


risk_engine_service = RiskEngineService()







