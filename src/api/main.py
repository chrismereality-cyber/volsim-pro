import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from src.core import environment
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.websockets import WebSocket, WebSocketDisconnect
from sqlalchemy import text
from database import engine

from routers.analytics import router as analytics_router
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from src.risk.risk_engine import router as risk_router
from src.auth.dependencies import permission_guard
from src.auth.models import AuthorizationContext
from src.auth.rbac import AuthorizationError, require_permission
from src.auth.service import AuthorizationService, IdentityService
from src.auth.tokens import decode_access_token


from src.services.global_trading_state_service import global_trading_state_service
from src.contracts.trading_state_adapter import build_trading_state_contract
from src.services.position_service import position_service
from src.services.vault_service import vault_service
from src.services.mt5_service import mt5_service
from src.providers.registry import provider_registry
from src.services.statistics_service import statistics_service





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

    print("Database pool warm-up: START")

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        print("Database pool warm-up: COMPLETE")

    except Exception as exc:
        print(
            "Database pool warm-up: FAILED "
            f"{type(exc).__name__}: {exc}"
        )
        raise

    print("Position recovery: START")

    try:
        recovery = await position_service.recover_from_database()

        print(
            "Position recovery: COMPLETE "
            f"count={recovery.get('count', 0)}"
        )

        execution_mode = os.getenv(
            "VOLSIM_EXECUTION_MODE",
            "PAPER",
        ).strip().upper()

        if execution_mode not in {"PAPER", "LIVE"}:
            raise RuntimeError(
                f"Invalid VOLSIM_EXECUTION_MODE: {execution_mode!r}"
            )

        print(
            "Execution mode: "
            f"{execution_mode}"
        )

        if execution_mode == "LIVE":
            print(
                "MT5 position reconciliation: START"
            )

            reconciliation = (
                await position_service.sync_from_mt5()
            )

            reconciliation_status = (
                reconciliation.get("status")
            )

            print(
                "MT5 position reconciliation: "
                f"{reconciliation_status}"
            )

            if reconciliation_status == "BROKER_QUERY_FAILED":
                raise RuntimeError(
                    "LIVE startup aborted: "
                    "MT5 position reconciliation "
                    "failed. "
                    f"{reconciliation.get('error')}"
                )

            if reconciliation_status == "RECONCILIATION_FAILED":
                raise RuntimeError(
                    "LIVE startup aborted: "
                    "position reconciliation "
                    "raised an unexpected error. "
                    f"{reconciliation.get('error')}"
                )

            discrepancies = reconciliation.get(
                "discrepancies",
                [],
            )

            if discrepancies:
                raise RuntimeError(
                    "LIVE startup aborted: "
                    f"{len(discrepancies)} "
                    "position reconciliation "
                    "discrepancy(ies) detected."
                )

            print(
                "MT5 position reconciliation: "
                "COMPLETE"
            )

        else:
            print(
                "MT5 position reconciliation: "
                "SKIPPED (PAPER mode)"
            )

        print("Vault state recovery: START")

        vault_state = await vault_service.load_persistent_state()

        print(
            "Vault state recovery: COMPLETE "
            f"profile={vault_state.get('allocation_profile')} "
            f"pending={vault_state.get('pending_allocation', 0)} "
            f"last_realized_profit={vault_service.last_realized_profit}"
        )

    except Exception as exc:
        print(
            "Position recovery: FAILED "
            f"{type(exc).__name__}: {exc}"
        )

        raise

    reconciliation_task = None
    statistics_task = None

    async def statistics_worker():
        while True:
            try:
                await statistics_service.refresh_durable_history()
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                print(
                    f"[STATISTICS] Durable history refresh failed: {exc}"
                )

            await asyncio.sleep(5)
    async def reconciliation_worker():
        """
        Continuously reconcile authoritative LIVE broker positions.

        This worker is strictly read-only with respect to broker
        trading operations. It never opens, modifies, or closes
        broker positions.

        Startup reconciliation remains strict and is handled above.
        Runtime reconciliation failures and discrepancies are logged
        and retried on the next cycle.
        """

        interval_seconds = 5

        print(
            "MT5 reconciliation worker: START"
        )

        try:
            while True:
                try:
                    reconciliation = (
                        await position_service.sync_from_mt5()
                    )

                    reconciliation_status = (
                        reconciliation.get("status")
                    )

                    discrepancies = (
                        reconciliation.get(
                            "discrepancies",
                            [],
                        )
                    )

                    if reconciliation_status == "RECONCILED":
                        print(
                            "MT5 reconciliation worker: "
                            "RECONCILED"
                        )

                    elif (
                        reconciliation_status
                        == "RECONCILED_WITH_DISCREPANCIES"
                    ):
                        print(
                            "MT5 reconciliation worker: "
                            f"DISCREPANCIES={len(discrepancies)}"
                        )

                    elif reconciliation_status == "BROKER_QUERY_FAILED":
                        print(
                            "MT5 reconciliation worker: "
                            "BROKER_QUERY_FAILED "
                            f"error={reconciliation.get('error')}"
                        )

                    elif (
                        reconciliation_status
                        == "RECONCILIATION_FAILED"
                    ):
                        print(
                            "MT5 reconciliation worker: "
                            "RECONCILIATION_FAILED "
                            f"error={reconciliation.get('error')}"
                        )

                    else:
                        print(
                            "MT5 reconciliation worker: "
                            f"UNEXPECTED_STATUS={reconciliation_status}"
                        )

                except asyncio.CancelledError:
                    raise

                except Exception as exc:
                    print(
                        "MT5 reconciliation worker cycle failed: "
                        f"{type(exc).__name__}: {exc}"
                    )

                await asyncio.sleep(
                    interval_seconds
                )

        except asyncio.CancelledError:
            print(
                "MT5 reconciliation worker: STOP"
            )
            raise

    execution_mode = os.getenv(
        "VOLSIM_EXECUTION_MODE",
        "PAPER",
    ).strip().upper()

    if execution_mode == "LIVE":
        reconciliation_task = asyncio.create_task(
            reconciliation_worker()
        )

    await statistics_service.refresh_durable_history()
    statistics_task = asyncio.create_task(
        statistics_worker()
    )

    yield

    if statistics_task is not None:
        statistics_task.cancel()
        try:
            await statistics_task
        except asyncio.CancelledError:
            pass
    if reconciliation_task is not None:
        reconciliation_task.cancel()

        try:
            await reconciliation_task
        except asyncio.CancelledError:
            pass

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
    auth_router,
    prefix="/api/auth",
)

app.include_router(
    admin_router,
    prefix="/api",
)

app.include_router(
    risk_router,
    prefix="/api",
)


# ---------------------------------------------------------------------------
# MT5 Instrument Registry
# ---------------------------------------------------------------------------

@app.get("/api/instruments/mt5")
async def mt5_instruments(
    context: AuthorizationContext = Depends(
        permission_guard("portfolio.read")
    ),
):
    """
    Return the authoritative MT5 instrument registry.

    This endpoint is read-only:
    - no orders are submitted
    - no symbols are automatically selected
    - no database state is modified
    - no treasury/vault state is touched
    """
    registry = mt5_service.get_instrument_registry()

    return {
        "status": "ok",
        "provider": "MT5",
        "count": len(registry),
        "instruments": registry,
    }


# ---------------------------------------------------------------------------
# Global Trading State
# ---------------------------------------------------------------------------

@app.get("/api/trading-state")
async def trading_state(
    context: AuthorizationContext = Depends(
        permission_guard("dashboard.read")
    ),
):
    state = global_trading_state_service.snapshot()

    return build_trading_state_contract(
        state
    ).model_dump()


@app.get("/api/telemetry")
async def telemetry(
    context: AuthorizationContext = Depends(
        permission_guard("dashboard.read")
    ),
):
    state = global_trading_state_service.snapshot()

    return JSONResponse(
        build_trading_state_contract(
            state
        ).model_dump()
    )


# ---------------------------------------------------------------------------
# Primary Global Trading State WebSocket
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Primary Global Trading State WebSocket
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Primary Global Trading State WebSocket
# ---------------------------------------------------------------------------

@app.websocket("/ws/trading-state")
async def trading_state_socket(
    websocket: WebSocket,
):
    await websocket.accept()

    try:
        try:
            auth_message = await asyncio.wait_for(
                websocket.receive_json(),
                timeout=10,
            )
        except asyncio.TimeoutError:
            await websocket.close(
                code=1008,
                reason="WebSocket authentication timeout.",
            )
            return

        if not isinstance(auth_message, dict):
            await websocket.close(
                code=1008,
                reason="Invalid authentication message.",
            )
            return

        if auth_message.get("type") != "authenticate":
            await websocket.close(
                code=1008,
                reason="WebSocket authentication required.",
            )
            return

        access_token = auth_message.get("token")

        if not isinstance(access_token, str) or not access_token.strip():
            await websocket.close(
                code=1008,
                reason="WebSocket authentication token missing.",
            )
            return

        try:
            token_payload = decode_access_token(
                access_token
            )
        except Exception:
            await websocket.close(
                code=1008,
                reason="Invalid or expired access token.",
            )
            return

        user_id = token_payload.get("sub")
        username = token_payload.get("username")
        roles = token_payload.get("roles")

        if not user_id:
            await websocket.close(
                code=1008,
                reason="Access token is missing subject.",
            )
            return

        if not isinstance(roles, list):
            await websocket.close(
                code=1008,
                reason="Access token contains invalid roles.",
            )
            return

        identity = IdentityService.build_identity(
            user_id=str(user_id),
            username=username,
            roles=roles,
            is_active=True,
        )

        context = AuthorizationService.context(
            identity,
            source="jwt-websocket",
        )

        try:
            require_permission(
                context,
                "dashboard.read",
            )
        except AuthorizationError:
            await websocket.close(
                code=1008,
                reason="Permission denied: dashboard.read",
            )
            return

        # Only authenticated and authorized clients reach this point.
        # Preserve the frontend's existing connection-state contract.
        await websocket.send_json({
            "__socket_status": "CONNECTED",
        })

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
        print(
            f"Trading State WebSocket error: {exc}"
        )

        try:
            await websocket.close()
        except Exception:
            pass

