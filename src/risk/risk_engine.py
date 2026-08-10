import asyncio
import time

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
    Query,
    Body,
)

from src.services.global_state_service import global_state_orchestrator

router = APIRouter()


@router.get("/telemetry")
async def get_telemetry():
    return global_state_orchestrator.snapshot()


@router.get("/metrics")
async def get_metrics():
    return global_state_orchestrator.snapshot()


@router.get("/analytics/performance")
async def get_performance_analytics(
    timeframe: str = Query("30D")
):

    state = global_state_orchestrator.snapshot()

    return {

        "timeframe": timeframe,

        "performance_curve": [],

        "summary": state.get(
            "statistics_state",
            {}
        )

    }


@router.get("/risk/limits")
async def risk_limits():

    return {

        "max_daily_drawdown": 5.0,

        "risk_per_trade": 1.0,

        "max_position_size": 2.0,

        "daily_loss_limit": 500.0,

        "circuit_breaker_active": False

    }


@router.post("/risk/config")
async def update_risk_config(
    payload: dict = Body(...)
):

    return {

        "status": "success",

        "updated_config": payload

    }


@router.websocket("/trading-state")
async def websocket_trading_state(
    websocket: WebSocket
):

    await websocket.accept()

    try:

        while True:

            state = global_state_orchestrator.snapshot()

            await websocket.send_json(state)

            await asyncio.sleep(1)

    except WebSocketDisconnect:

        pass

    except Exception as ex:

        print(ex)
