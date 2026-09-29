from __future__ import annotations

from typing import Any


class AIPositionManagementService:
    """
    Decision-only position management layer.

    Responsibilities:
    - Inspect an existing OPEN position.
    - Compare its direction with the current AI decision.
    - Authorize an EXIT decision when the AI direction reverses.

    This service MUST NOT:
    - send orders
    - call MT5
    - mutate positions
    - write the trade ledger
    """

    def evaluate(
        self,
        position: dict[str, Any] | None,
        ai_decision: dict[str, Any] | None,
    ) -> dict[str, Any]:
        if not position:
            return {
                "status": "HOLD",
                "action": "HOLD",
                "reason": "NO_OPEN_POSITION",
                "execution_authorized": False,
            }

        if position.get("status") != "OPEN":
            return {
                "status": "HOLD",
                "action": "HOLD",
                "reason": "POSITION_NOT_OPEN",
                "execution_authorized": False,
            }

        decision = str(
            (ai_decision or {}).get("decision", "HOLD")
        ).upper()

        side = str(
            position.get("side", "")
        ).upper()

        trade_id = position.get("trade_id")

        if side == "BUY" and decision == "SELL":
            return {
                "status": "EXIT",
                "action": "EXIT",
                "reason": "AI_DIRECTION_REVERSED",
                "position_side": side,
                "ai_decision": decision,
                "trade_id": trade_id,
                "execution_authorized": True,
            }

        if side == "SELL" and decision == "BUY":
            return {
                "status": "EXIT",
                "action": "EXIT",
                "reason": "AI_DIRECTION_REVERSED",
                "position_side": side,
                "ai_decision": decision,
                "trade_id": trade_id,
                "execution_authorized": True,
            }

        return {
            "status": "HOLD",
            "action": "HOLD",
            "reason": "NO_EXIT_CONDITION",
            "position_side": side,
            "ai_decision": decision,
            "execution_authorized": False,
        }


ai_position_management_service = AIPositionManagementService()

