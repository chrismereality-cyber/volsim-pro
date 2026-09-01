import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.websockets import WebSocket, WebSocketDisconnect

from routers.analytics import router as analytics_router
from src.risk.risk_engine import router as risk_router

from src.services.global_trading_state_service import global_trading_state_service
from src.contracts.trading_state_adapter import build_trading_state_contract
from src.services.position_service import position_service





@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    VolSim-Pro application lifecycle.

    Startup:
        Recover durable positions from PostgreSQL before
        normal API/WebSocket trading-state traffic begins.

    Shutdown:
        No trading action is performed here.
    """

    print("=== VOLSIM-PRO APPLICATION STARTUP ===")
    print("Position recovery: START")

    try:
        recovery = await position_service.recover_from_database()

        print(
            "Position recovery: COMPLETE "
            f"count={recovery.get('count', 0)}"
        )

    except Exception as exc:
        print(
            "Position recovery: FAILED "
            f"{type(exc).__name__}: {exc}"
        )

        raise

    yield

    print("=== VOLSIM-PRO APPLICATION SHUTDOWN ===")


app = FastAPI(
    title="VolSim-Pro Enterprise",
    version="1.0.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {
        "service": "VolSim-Pro Enterprise",
        "status": "online",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
    }


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

app.include_router(
    analytics_router,
    prefix="/api/analytics",
)

app.include_router(
    risk_router,
    prefix="/api",
)


# ---------------------------------------------------------------------------
# Global Trading State
# ---------------------------------------------------------------------------

@app.get("/api/trading-state")
async def trading_state():
    state = global_trading_state_service.snapshot()

    return build_trading_state_contract(
        state
    ).model_dump()


@app.get("/api/telemetry")
async def telemetry():
    state = global_trading_state_service.snapshot()

    return JSONResponse(
        build_trading_state_contract(
            state
        ).model_dump()
    )


# ---------------------------------------------------------------------------
# Primary Global Trading State WebSocket
# ---------------------------------------------------------------------------

@app.websocket("/ws/trading-state")
async def trading_state_socket(
    websocket: WebSocket,
):
    await websocket.accept()

    try:
        while True:
            state = global_trading_state_service.snapshot()

            payload = build_trading_state_contract(
                state
            ).model_dump()

            await websocket.send_json(
                payload
            )

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass

    except Exception as exc:
        print(f"Trading State WebSocket error: {exc}")

        try:
            await websocket.close()
        except Exception:
            pass






