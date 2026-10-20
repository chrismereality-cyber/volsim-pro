import logging
import math
from database import SessionLocal
from src.risk.risk_policy_repository import RiskPolicyRepository

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
        "BTCUSDm",
    }

    def __init__(self):
        # One authoritative runtime risk policy.
        #
        # These values preserve the existing production defaults.
        # Admin configuration updates this policy through the service;
        # execution, sizing, and global state all consume the same policy.
        # Persistent PostgreSQL policy is the authoritative production
        # source. Class constants remain migration/default reference
        # values only and are never an operational fallback.
        self._risk_policy = None
        self._risk_policy_ready = False

    # ------------------------------------------------------------------
    # Authoritative risk policy
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_policy(policy):
        """Normalize and validate the complete authoritative risk policy."""
        required_fields = (
            "max_daily_drawdown_percent",
            "risk_per_trade_percent",
            "max_position_size",
            "liquidation_drawdown_percent",
            "liquidation_margin_usage_percent",
        )

        if not isinstance(policy, dict):
            raise ValueError("Risk policy must be an object")

        validated = {}

        for field in required_fields:
            try:
                value = float(policy[field])
            except (KeyError, TypeError, ValueError, OverflowError) as exc:
                raise ValueError(
                    f"Invalid or missing risk policy field: {field}"
                ) from exc

            if not math.isfinite(value) or value <= 0:
                raise ValueError(
                    f"Risk policy field must be finite and positive: {field}"
                )

            validated[field] = value

        if (
            validated["liquidation_drawdown_percent"]
            < validated["max_daily_drawdown_percent"]
        ):
            raise ValueError(
                "liquidation_drawdown_percent must be greater than "
                "max_daily_drawdown_percent"
            )

        if (
            validated["risk_per_trade_percent"]
            > validated["max_daily_drawdown_percent"]
        ):
            raise ValueError(
                "risk_per_trade_percent cannot exceed "
                "max_daily_drawdown_percent"
            )

        return validated

    def load_persistent_policy(self):
        """
        Load the authoritative production risk policy from PostgreSQL.

        Failure is fail-closed: no hard-coded production policy is used
        when persistent policy state cannot be loaded.
        """

        # Clear the previous policy before any reload operation, including
        # database session creation. A failed reload must never leave stale
        # policy state marked authoritative.
        self._risk_policy = None
        self._risk_policy_ready = False
        db = None

        try:
            db = SessionLocal()
            policy = self._validate_policy(
                RiskPolicyRepository.load_policy(db)
            )

        except Exception:
            self._risk_policy = None
            self._risk_policy_ready = False

            logging.getLogger(__name__).exception(
                "Authoritative persistent risk policy load failed"
            )

            raise

        finally:
            if db is not None:
                db.close()

        self._risk_policy = dict(policy)
        self._risk_policy_ready = True

        logging.getLogger(__name__).info(
            "Authoritative persistent risk policy loaded successfully"
        )

        return self.get_policy()

    def is_policy_ready(self):
        """Return whether the authoritative persistent policy is loaded."""

        return self._risk_policy_ready
    def get_policy(self):
        """
        Return the active authoritative risk policy.

        A copy is returned so callers cannot mutate the service policy
        without going through update_policy().
        """
        if not self._risk_policy_ready or self._risk_policy is None:
            raise RuntimeError(
                "Authoritative persistent risk policy is not loaded"
            )

        return dict(self._risk_policy)

    def update_policy(self, payload: dict):
        """
        Validate and persist the authoritative risk policy.

        The database commit must succeed before the runtime singleton
        is replaced. This prevents runtime/DB divergence when
        persistence fails.
        """

        if not self._risk_policy_ready or self._risk_policy is None:
            raise RuntimeError(
                "Authoritative persistent risk policy is not loaded"
            )

        if not isinstance(payload, dict):
            raise ValueError("Risk policy payload must be an object")

        allowed_fields = {
            "max_daily_drawdown_percent",
            "risk_per_trade_percent",
            "max_position_size",
            "liquidation_drawdown_percent",
            "liquidation_margin_usage_percent",
        }

        unknown_fields = set(payload) - allowed_fields

        if unknown_fields:
            raise ValueError(
                "Unsupported risk policy fields: "
                + ", ".join(sorted(unknown_fields))
            )

        updated = dict(self._risk_policy)

        for field in allowed_fields:

            if field not in payload:
                continue

            try:
                value = float(payload[field])
            except (TypeError, ValueError, OverflowError) as exc:
                raise ValueError(
                    f"{field} must be numeric and finite"
                ) from exc

            if not math.isfinite(value) or value <= 0:
                raise ValueError(
                    f"{field} must be finite and greater than zero"
                )

            updated[field] = value

        # Validate the complete merged policy before database access.
        updated = self._validate_policy(updated)

        db = SessionLocal()

        try:
            persisted_policy = RiskPolicyRepository.update_policy(
                db,
                updated,
            )
        finally:
            db.close()

        # Runtime state changes only after the database commit succeeds.
        self._risk_policy = dict(persisted_policy)

        return self.get_policy()


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



    def snapshot(self, portfolio_state=None):
        """
        Return the authoritative risk calculation inputs.

        The Global Trading State service consumes this snapshot.
        """

        try:
            if not self._risk_policy_ready or self._risk_policy is None:
                raise RuntimeError(
                    "Authoritative persistent risk policy is not loaded"
                )

            if isinstance(portfolio_state, dict):
                portfolio = portfolio_state
            else:
                portfolio = self._portfolio_snapshot()

            # Reject incomplete or invalid portfolio inputs before
            # calculating risk. Missing data must never imply zero risk.
            required_portfolio_fields = (
                "balance",
                "equity",
                "margin",
                "exposure",
            )
            validated_portfolio = {}

            for field in required_portfolio_fields:
                if field not in portfolio or portfolio[field] is None:
                    raise ValueError(
                        f"Required portfolio field unavailable: {field}"
                    )

                try:
                    value = float(portfolio[field])
                except (TypeError, ValueError, OverflowError) as exc:
                    raise ValueError(
                        f"Invalid portfolio field: {field}"
                    ) from exc

                if not math.isfinite(value):
                    raise ValueError(
                        f"Non-finite portfolio field: {field}"
                    )

                validated_portfolio[field] = value

            if validated_portfolio["balance"] <= 0:
                raise ValueError("Portfolio balance must be greater than zero")

            if validated_portfolio["equity"] <= 0:
                raise ValueError("Portfolio equity must be greater than zero")

            if validated_portfolio["margin"] < 0:
                raise ValueError("Portfolio margin cannot be negative")

            if validated_portfolio["exposure"] < 0:
                raise ValueError("Portfolio exposure cannot be negative")

            required_policy_fields = (
                "max_daily_drawdown_percent",
                "risk_per_trade_percent",
                "max_position_size",
                "liquidation_drawdown_percent",
                "liquidation_margin_usage_percent",
            )

            for field in required_policy_fields:
                try:
                    value = float(self._risk_policy[field])
                except (KeyError, TypeError, ValueError, OverflowError) as exc:
                    raise ValueError(
                        f"Invalid risk policy field: {field}"
                    ) from exc

                if not math.isfinite(value) or value <= 0:
                    raise ValueError(
                        f"Risk policy field must be finite and positive: {field}"
                    )

            # Revalidate cross-field policy invariants at snapshot time.
            # An ACTIVE snapshot must never expose an internally
            # contradictory policy, even if runtime state was mutated.
            validated_policy = {
                field: float(self._risk_policy[field])
                for field in required_policy_fields
            }

            if (
                validated_policy["liquidation_drawdown_percent"]
                < validated_policy["max_daily_drawdown_percent"]
            ):
                raise ValueError(
                    "liquidation_drawdown_percent must be greater than "
                    "max_daily_drawdown_percent"
                )

            if (
                validated_policy["risk_per_trade_percent"]
                > validated_policy["max_daily_drawdown_percent"]
            ):
                raise ValueError(
                    "risk_per_trade_percent cannot exceed "
                    "max_daily_drawdown_percent"
                )

            balance = validated_portfolio["balance"]

            equity = validated_portfolio["equity"]
            margin = validated_portfolio["margin"]
            exposure = validated_portfolio["exposure"]

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
                    self._risk_policy["max_daily_drawdown_percent"]
                    / 100.0
                ),
                2,
            )

            risk_per_trade_amount = round(
                equity
                * (
                    self._risk_policy["risk_per_trade_percent"]
                    / 100.0
                ),
                2,
            )

            # ----------------------------------------------------------
            # Protection state
            # ----------------------------------------------------------

            circuit_breaker_active = (
                current_drawdown
                >= self._risk_policy["max_daily_drawdown_percent"]
            )

            liquidation_warning = (
                current_drawdown
                >= self._risk_policy["liquidation_drawdown_percent"]
                or
                margin_usage
                >= self._risk_policy["liquidation_margin_usage_percent"]
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
                    self._risk_policy["max_daily_drawdown_percent"],

                "maximum_allowed_drawdown":
                    self._risk_policy["max_daily_drawdown_percent"],

                "risk_per_trade":
                    self._risk_policy["risk_per_trade_percent"],

                "risk_per_trade_amount":
                    risk_per_trade_amount,

                "max_position_size":
                    self._risk_policy["max_position_size"],

                "daily_loss_limit":
                    daily_loss_limit,

                "daily_loss_limit_percent":
                    self._risk_policy["max_daily_drawdown_percent"],

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

            logger.exception("Risk snapshot failed")

            # ERROR is an unavailable risk state, not a zero-risk state.
            # Use None for unavailable measurements and policy values.
            policy = (
                self._risk_policy
                if isinstance(self._risk_policy, dict)
                else {}
            )

            return {
                "balance": None,
                "equity": None,
                "margin": None,
                "exposure": None,
                "max_daily_drawdown":
                    policy.get("max_daily_drawdown_percent"),
                "maximum_allowed_drawdown":
                    policy.get("max_daily_drawdown_percent"),
                "risk_per_trade":
                    policy.get("risk_per_trade_percent"),
                "risk_per_trade_amount": None,
                "max_position_size":
                    policy.get("max_position_size"),
                "daily_loss_limit": None,
                "daily_loss_limit_percent":
                    policy.get("max_daily_drawdown_percent"),
                "current_drawdown": None,
                "margin_usage": None,
                "liquidation_warning": False,
                "circuit_breaker_active": False,
                "status": "ERROR",
                "error": str(exc),
            }

    # ------------------------------------------------------------------
    # Execution gate
    # ------------------------------------------------------------------
    def approve_order(self, order_request: dict):
        """
        Risk gate called by Execution Service.

        This is the final risk approval immediately before execution.

        Entry protection:
        - BUY/SELL entries require a valid protective stop.
        - Maximum loss at the supplied stop is calculated from the
          live broker tick economics.
        - Calculated risk must not exceed the authoritative
          risk-per-trade budget.

        EXIT remains exempt from entry protective-stop requirements.
        """

        if not self._risk_policy_ready or self._risk_policy is None:
            return {
                "approved": False,
                "reason": "Authoritative persistent risk policy is not loaded",
                "risk_engine_ready": False,
            }

        state = self.snapshot()

        # An invalid risk snapshot must never authorize a new order.
        # Preserve the exact EXIT path so its existing downstream position,
        # broker, and execution validations can still run.
        if (
            state.get("status") == "ERROR"
            and order_request.get("type") != "EXIT"
        ):
            return {
                "approved": False,
                "reason": "Risk snapshot unavailable; order rejected",
                "risk": state,
            }

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
        # Order type
        # --------------------------------------------------------------

        order_type = str(
            order_request.get("type", "")
        ).upper()

        if not order_type:

            return {
                "approved": False,
                "reason": "Missing order type",
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

        if not math.isfinite(volume):

            return {
                "approved": False,
                "reason": "Volume must be finite",
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

        if not all(
            math.isfinite(value)
            for value in (
                broker_min,
                broker_max,
                broker_step,
            )
        ):

            return {
                "approved": False,
                "reason": "Broker volume contract contains non-finite values",
            }

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

        if volume > self._risk_policy["max_position_size"]:

            return {
                "approved": False,
                "reason": "Maximum position size exceeded",
                "requested_volume": volume,
                "maximum_position_size":
                    self._risk_policy["max_position_size"],
                "broker_volume_max":
                    broker_max,
            }

        # --------------------------------------------------------------
        # Broker volume-step validation
        # --------------------------------------------------------------

        if broker_step > 0:

            step_ratio = volume / broker_step
            nearest_step = round(step_ratio)

            if abs(
                step_ratio - nearest_step
            ) > 1e-9:

                return {
                    "approved": False,
                    "reason": "Volume does not match broker volume step",
                    "requested_volume": volume,
                    "broker_volume_step": broker_step,
                }

        # --------------------------------------------------------------
        # Entry protective-stop risk gate
        #
        # EXIT is intentionally exempt. It is a risk-reduction action
        # and must remain executable without an entry stop.
        # --------------------------------------------------------------

        if order_type in {"BUY", "SELL"}:

            entry_price = order_request.get("price")

            if entry_price is None:

                return {
                    "approved": False,
                    "reason": "Missing entry price",
                }

            try:
                entry_price = float(entry_price)
            except (TypeError, ValueError):

                return {
                    "approved": False,
                    "reason": "Invalid entry price",
                }

            if not math.isfinite(entry_price):

                return {
                    "approved": False,
                    "reason": "Entry price must be finite",
                }

            if entry_price <= 0:

                return {
                    "approved": False,
                    "reason": "Entry price must be greater than zero",
                }

            stop_loss = order_request.get(
                "stop_loss"
            )

            if stop_loss is None:

                return {
                    "approved": False,
                    "reason": "Protective stop required for entry",
                }

            try:
                stop_loss = float(stop_loss)
            except (TypeError, ValueError):

                return {
                    "approved": False,
                    "reason": "Invalid protective stop",
                }

            if not math.isfinite(stop_loss):

                return {
                    "approved": False,
                    "reason": "Protective stop must be finite",
                }

            if stop_loss <= 0:

                return {
                    "approved": False,
                    "reason": "Protective stop required for entry",
                }

            if order_type == "BUY" and stop_loss >= entry_price:

                return {
                    "approved": False,
                    "reason": "BUY protective stop must be below entry price",
                }

            if order_type == "SELL" and stop_loss <= entry_price:

                return {
                    "approved": False,
                    "reason": "SELL protective stop must be above entry price",
                }

            tick_size = float(
                contract.get(
                    "trade_tick_size",
                    0.0,
                ) or 0.0
            )

            tick_value = float(
                contract.get(
                    "trade_tick_value",
                    0.0,
                ) or 0.0
            )

            if not math.isfinite(tick_size):

                return {
                    "approved": False,
                    "reason": "Broker tick size must be finite",
                }

            if not math.isfinite(tick_value):

                return {
                    "approved": False,
                    "reason": "Broker tick value must be finite",
                }

            if tick_size <= 0:

                return {
                    "approved": False,
                    "reason": "Broker tick size unavailable",
                }

            if tick_value <= 0:

                return {
                    "approved": False,
                    "reason": "Broker tick value unavailable",
                }

            stop_distance = abs(
                entry_price - stop_loss
            )

            stop_ticks = (
                stop_distance / tick_size
            )

            estimated_loss = (
                stop_ticks
                * tick_value
                * volume
            )

            allowed_risk = float(
                state.get(
                    "risk_per_trade_amount",
                    0.0,
                ) or 0.0
            )

            if not math.isfinite(allowed_risk):

                return {
                    "approved": False,
                    "reason": "Risk-per-trade budget must be finite",
                }

            if allowed_risk <= 0:

                return {
                    "approved": False,
                    "reason": "Risk-per-trade budget unavailable",
                }

            if not all(
                math.isfinite(value)
                for value in (
                    stop_distance,
                    stop_ticks,
                    estimated_loss,
                )
            ):

                return {
                    "approved": False,
                    "reason": "Risk calculation produced a non-finite value",
                }

            if estimated_loss > allowed_risk:

                return {
                    "approved": False,
                    "reason":
                        "Protective stop risk exceeds risk-per-trade limit",
                    "estimated_loss":
                        estimated_loss,
                    "allowed_risk":
                        allowed_risk,
                    "stop_distance":
                        stop_distance,
                    "stop_ticks":
                        stop_ticks,
                    "requested_volume":
                        volume,
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

                "protective_stop":
                    (
                        "PASS"
                        if order_type in {"BUY", "SELL"}
                        else "NOT_REQUIRED"
                    ),

            },

            "risk":
                state,

        }

risk_engine_service = RiskEngineService()
