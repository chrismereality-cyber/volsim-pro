from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Query,
    Body,
)

from src.services.global_trading_state_service import (
    global_trading_state_service,
)

router = APIRouter()


@router.get("/telemetry")
async def get_telemetry():
    return global_trading_state_service.snapshot()


@router.get("/metrics")
async def get_metrics():
    return global_trading_state_service.snapshot()


@router.get("/analytics/performance")
async def get_performance_analytics(
    timeframe: str = Query("30D"),
):

    state = global_trading_state_service.snapshot()

    return {
        "timeframe": timeframe,
        "performance_curve": [],
        "summary": state.get(
            "statistics",
            {}
        ),
    }


@router.get("/risk/limits")
async def risk_limits():

    state = global_trading_state_service.snapshot()

    account = state.get(
        "account",
        {}
    )

    portfolio = state.get(
        "portfolio",
        {}
    )

    equity = float(
        account.get(
            "equity",
            portfolio.get(
                "equity",
                0.0
            )
        ) or 0.0
    )

    balance = float(
        account.get(
            "balance",
            portfolio.get(
                "balance",
                0.0
            )
        ) or 0.0
    )

    max_daily_drawdown_percent = 5.0
    risk_per_trade_percent = 1.0
    max_position_size = 2.0

    daily_loss_limit = round(
        equity * (
            max_daily_drawdown_percent / 100.0
        ),
        2
    )

    risk_per_trade_amount = round(
        equity * (
            risk_per_trade_percent / 100.0
        ),
        2
    )

    current_drawdown = float(
        state.get(
            "risk",
            {}
        ).get(
            "current_drawdown",
            0.0
        ) or 0.0
    )

    circuit_breaker_active = (
        current_drawdown >=
        max_daily_drawdown_percent
    )

    return {

        "balance":
            balance,

        "equity":
            equity,

        "max_daily_drawdown":
            max_daily_drawdown_percent,

        "risk_per_trade":
            risk_per_trade_percent,

        "risk_per_trade_amount":
            risk_per_trade_amount,

        "max_position_size":
            max_position_size,

        "daily_loss_limit":
            daily_loss_limit,

        "daily_loss_limit_percent":
            max_daily_drawdown_percent,

        "current_drawdown":
            current_drawdown,

        "circuit_breaker_active":
            circuit_breaker_active,

        "status":
            "ACTIVE"

    }


@router.post("/risk/config")
async def update_risk_config(
    payload: dict = Body(...)
):

    return {
        "status": "success",
        "updated_config": payload,
    }


@router.websocket("/trading-state")
async def websocket_trading_state(
    websocket: WebSocket,
):

    await websocket.accept()

    try:

        while True:

            state = (
                global_trading_state_service.snapshot()
            )

            await websocket.send_json(
                state
            )

            import asyncio

            await asyncio.sleep(1)

    except WebSocketDisconnect:

        pass
