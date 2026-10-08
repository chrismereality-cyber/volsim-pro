from fastapi import (
    APIRouter,
    Query,
    Body,
    Depends,
)

from src.auth.dependencies import permission_guard



from src.services.global_trading_state_service import (
    global_trading_state_service,
)

from src.services.risk_service import (
    risk_engine_service,
)

router = APIRouter()


@router.get("/metrics")
async def get_metrics(
    context = Depends(
        permission_guard("dashboard.read")
    ),
):

    return global_trading_state_service.snapshot()


@router.get("/risk/limits")
async def risk_limits(
    context = Depends(
        permission_guard("risk.read")
    ),
):
    """
    Return the authoritative production risk state.

    The RiskEngineService is the single source of truth for policy
    and calculated risk state.
    """

    return risk_engine_service.snapshot()


@router.post("/risk/config")
async def update_risk_config(
    payload: dict = Body(...),
    context = Depends(
        permission_guard("risk.manage")
    ),
):
    """
    Update the authoritative runtime risk policy.

    This endpoint delegates policy validation and mutation to the
    production RiskEngineService. It does not maintain a second
    Admin-side risk configuration.
    """

    try:

        updated_policy = risk_engine_service.update_policy(
            payload
        )

        return {
            "status": "success",
            "policy": updated_policy,
        }

    except ValueError as exc:

        return {
            "status": "error",
            "reason": str(exc),
            "policy": risk_engine_service.get_policy(),
        }
