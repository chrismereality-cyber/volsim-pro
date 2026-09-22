from dataclasses import dataclass
from typing import Final

from src.auth.models import AuthorizationContext
from src.auth.rbac import require_permission
from src.treasury.capital_approval_repository import (
    capital_approval_repository,
)
from src.treasury.capital_movement_repository import (
    capital_movement_repository,
)


APPROVAL_DECISIONS: Final[frozenset[str]] = frozenset({
    "APPROVED",
    "REJECTED",
})

APPROVABLE_MOVEMENT_STATUSES: Final[frozenset[str]] = frozenset({
    "REQUESTED",
    "PENDING_APPROVAL",
})


@dataclass(frozen=True)
class CapitalApprovalRequest:
    movement_id: str
    decision: str
    reason: str | None = None


class CapitalApprovalService:
    """
    Institutional capital movement approval service.

    Approval responsibility:

        REQUESTED / PENDING_APPROVAL
                  ↓
             APPROVAL
                  ↓
          APPROVED / REJECTED

    Separation of duties is mandatory:

        requested_by != approver_user_id

    This service does NOT:
    - mutate capital account balances
    - execute transfers
    - create settlements
    - reconcile external transactions
    - modify immutable vault state
    """

    @staticmethod
    def _approver_user_id(
        context: AuthorizationContext,
    ) -> int:
        try:
            approver_user_id = int(
                context.identity.user_id
            )
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "Approval identity must contain a valid user id."
            ) from exc

        if approver_user_id <= 0:
            raise ValueError(
                "Approval identity must contain a positive user id."
            )

        return approver_user_id

    @staticmethod
    def validate_request(
        request: CapitalApprovalRequest,
        context: AuthorizationContext,
    ) -> int:
        require_permission(
            context,
            "capital.approve",
        )

        if not request.movement_id.strip():
            raise ValueError(
                "Capital movement id is required."
            )

        decision = request.decision.strip().upper()

        if decision not in APPROVAL_DECISIONS:
            raise ValueError(
                "Approval decision must be APPROVED or REJECTED."
            )

        if decision == "REJECTED":
            if not request.reason or not request.reason.strip():
                raise ValueError(
                    "A rejection reason is required."
                )

        return CapitalApprovalService._approver_user_id(
            context
        )

    @staticmethod
    async def approve(
        request: CapitalApprovalRequest,
        context: AuthorizationContext,
    ):
        approver_user_id = (
            CapitalApprovalService.validate_request(
                request,
                context,
            )
        )

        decision = request.decision.strip().upper()

        movement = await capital_movement_repository.get_by_id(
            request.movement_id.strip(),
        )

        if movement is None:
            raise ValueError(
                "Capital movement does not exist."
            )

        if movement["status"] not in APPROVABLE_MOVEMENT_STATUSES:
            raise ValueError(
                "Capital movement is not awaiting approval: "
                f"{movement['status']}"
            )

        requested_by = int(
            movement["requested_by"]
        )

        if requested_by == approver_user_id:
            raise PermissionError(
                "Separation-of-duties violation: "
                "the movement requester cannot approve the same movement."
            )

        existing = (
            await capital_approval_repository
            .get_by_movement_id(
                request.movement_id.strip(),
            )
        )

        if existing is not None:
            if int(existing["approver_user_id"]) != approver_user_id:
                raise RuntimeError(
                    "Capital movement already has an approval decision "
                    "from another approver."
                )

            if existing["decision"] != decision:
                raise RuntimeError(
                    "Capital movement already has a different approval decision."
                )

            return existing

        target_status = (
            "APPROVED"
            if decision == "APPROVED"
            else "REJECTED"
        )

        reason = (
            request.reason.strip()
            if request.reason
            else None
        )

        return await capital_approval_repository.create_decision(
            movement_id=request.movement_id.strip(),
            approver_user_id=approver_user_id,
            decision=decision,
            reason=reason,
            movement_status=target_status,
        )


capital_approval_service = CapitalApprovalService()
