import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.websockets import WebSocket
from fastapi.websockets import WebSocketDisconnect

from routers.analytics import router as analytics_router

from src.services.global_trading_state_service import global_trading_state_service
from src.services.global_state_service import global_state_orchestrator


app = FastAPI(title="VolSim-Pro Enterprise")


# Analytics API
app.include_router(
    analytics_router,
    prefix="/api/analytics"
)


@app.get("/api/trading-state")
async def trading_state():

    return global_trading_state_service.snapshot()


app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)


@app.get("/api/telemetry")
async def telemetry():

    return JSONResponse(
        global_trading_state_service.snapshot()
    )


@app.websocket("/ws/trading-state")
async def trading_state_socket(
    websocket: WebSocket
):

    await websocket.accept()

    try:

        while True:

            await websocket.send_json(
                global_trading_state_service.snapshot()
            )

            await asyncio.sleep(1)

    except WebSocketDisconnect:

        pass

    except Exception:

        await websocket.close()
