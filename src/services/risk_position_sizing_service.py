import logging
import math

from src.services.mt5_service import mt5_service


logger = logging.getLogger("volsim.risk_position_sizing")


class RiskPositionSizingService:
    """
    Risk-aware position sizing and protective-stop policy.

    Responsibilities:
    - consume an already-authorized AI BUY/SELL decision
    - consume the authoritative risk-per-trade budget
    - use decision-time ATR for protective-stop geometry
    - use live broker execution economics
    - calculate a risk-compliant broker volume
    - fail closed with NO_TRADE when no broker-valid
      volume can satisfy the risk budget

    Does NOT:
    - generate trading direction
    - change AI confidence
    - approve execution
    - bypass RiskService
    - place orders
    - manage positions
    - determine take-profit targets
    """

    POSITION_SIZING_MODEL = "FIXED_FRACTIONAL"
    STOP_ATR_MULTIPLIER = 1.0

    def _execution_context(self, symbol):
        try:
            context = mt5_service.get_symbol_execution_context(symbol)

            if not isinstance(context, dict):
                return {}

            return context

        except Exception as exc:
            logger.error(
                "Unable to obtain execution context for %s: %s",
                symbol,
                exc,
            )
            return {}

    def evaluate(
        self,
        ai_decision,
        risk_state,
        symbol=None,
    ):
        symbol = (
            symbol
            or ai_decision.get("symbol")
            or "XAUUSDm"
        )

        decision = str(
            ai_decision.get(
                "decision",
                "HOLD",
            )
        ).upper()

        base_state = {
            "status": "NO_TRADE",
            "model": self.POSITION_SIZING_MODEL,
            "symbol": symbol,
            "decision": decision,
            "risk_budget": float(
                risk_state.get(
                    "risk_per_trade_amount",
                    0.0,
                ) or 0.0
            ),
            "atr": float(
                ai_decision.get(
                    "atr",
                    0.0,
                ) or 0.0
            ),
            "stop_atr_multiplier": self.STOP_ATR_MULTIPLIER,
            "volume": 0.0,
            "stop_loss": 0.0,
            "entry_price": 0.0,
            "reason": "Awaiting valid BUY/SELL decision",
        }

        if decision not in {"BUY", "SELL"}:
            return base_state

        risk_budget = base_state["risk_budget"]
        if risk_budget <= 0:
            base_state["reason"] = (
                "Risk-per-trade budget unavailable"
            )
            return base_state

        atr = base_state["atr"]
        if atr <= 0:
            base_state["reason"] = (
                "ATR unavailable for protective-stop geometry"
            )
            return base_state

        context = self._execution_context(symbol)
        if not context:
            base_state["reason"] = (
                "Broker execution context unavailable"
            )
            return base_state

        if decision == "BUY":
            entry_price = float(
                context.get("ask", 0.0) or 0.0
            )
        else:
            entry_price = float(
                context.get("bid", 0.0) or 0.0
            )

        if entry_price <= 0:
            base_state["reason"] = (
                "Executable entry price unavailable"
            )
            return base_state

        tick_size = float(
            context.get(
                "trade_tick_size",
                0.0,
            ) or 0.0
        )

        tick_value = float(
            context.get(
                "trade_tick_value",
                0.0,
            ) or 0.0
        )

        broker_min = float(
            context.get(
                "volume_min",
                0.0,
            ) or 0.0
        )

        broker_max = float(
            context.get(
                "volume_max",
                0.0,
            ) or 0.0
        )

        broker_step = float(
            context.get(
                "volume_step",
                0.0,
            ) or 0.0
        )

        if tick_size <= 0 or tick_value <= 0:
            base_state["reason"] = (
                "Broker tick economics unavailable"
            )
            return base_state

        if broker_min <= 0 or broker_step <= 0:
            base_state["reason"] = (
                "Broker volume constraints unavailable"
            )
            return base_state

        stop_distance = (
            atr * self.STOP_ATR_MULTIPLIER
        )

        if decision == "BUY":
            stop_loss = entry_price - stop_distance
        else:
            stop_loss = entry_price + stop_distance

        if stop_loss <= 0:
            base_state["reason"] = (
                "Calculated protective stop is invalid"
            )
            return base_state

        risk_per_lot = (
            (stop_distance / tick_size)
            * tick_value
        )

        if risk_per_lot <= 0:
            base_state["reason"] = (
                "Calculated stop risk is invalid"
            )
            return base_state

        raw_volume = risk_budget / risk_per_lot

        if raw_volume < broker_min:
            base_state.update({
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "reason": (
                    "No broker-valid volume can satisfy "
                    "the risk-per-trade limit"
                ),
            })
            return base_state

        volume = raw_volume

        if broker_max > 0:
            volume = min(
                volume,
                broker_max,
            )

        step_count = math.floor(
            (volume / broker_step)
            + 1e-12
        )

        volume = (
            step_count
            * broker_step
        )

        if volume < broker_min:
            base_state.update({
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "reason": (
                    "Risk-compliant volume falls below "
                    "broker minimum after step normalization"
                ),
            })
            return base_state

        base_state.update({
            "status": "READY",
            "entry_price": entry_price,
            "stop_loss": stop_loss,
            "volume": volume,
            "estimated_loss": (
                (stop_distance / tick_size)
                * tick_value
                * volume
            ),
            "reason": (
                "Risk-compliant volume and protective stop calculated"
            ),
        })

        return base_state


risk_position_sizing_service = RiskPositionSizingService()

