# ============================================================================
# VolSim-Pro Enterprise
# Next Integration Phase
# Frontend Global Trading State Consolidation
# ============================================================================

OBJECTIVE

Complete the migration to a single Global Trading State architecture.

The backend is now confirmed as the authoritative source of truth.

Verified:

✓ MT5 Account State
✓ Market State
✓ Position State
✓ Order State
✓ Terminal State
✓ Portfolio State
✓ Execution State
✓ Risk State
✓ Statistics State
✓ Vault State
✓ AI State
✓ Telemetry State

REST

GET /api/telemetry

WebSocket

/ws/trading-state

are functioning correctly.

------------------------------------------------------------------------------

CURRENT FRONTEND AUDIT

RiskManagementPanel.tsx still maintains its own state.

Current issues:

- Opens its own WebSocket.
- Uses local React state.
- Falls back to HTTP polling.
- Does not consume the shared Global Trading Store.
- Duplicates business logic already provided by the backend.

This violates the Global Trading State architecture.

------------------------------------------------------------------------------

REQUIRED ARCHITECTURE

MT5
    │
MT5Service
    │
GlobalStateOrchestrator
    │
FastAPI
    │
/ws/trading-state
    │
Shared WebSocket Manager
    │
updateTradingState(payload)
    │
Zustand Global Store
    │
Dashboard Components

------------------------------------------------------------------------------

IMPLEMENTATION REQUIREMENTS

1.

Locate the existing shared WebSocket manager or create one.

The manager must:

- own the only WebSocket connection
- connect only to

/ws/trading-state

- automatically reconnect
- update the Zustand store

Never create WebSocket connections inside dashboard panels.

------------------------------------------------------------------------------

2.

Every incoming payload must call

updateTradingState(payload)

exactly once.

No panel should parse websocket messages independently.

------------------------------------------------------------------------------

3.

Refactor RiskManagementPanel.

Remove:

- local riskData state
- websocket lifecycle
- websocket parsing
- fallback polling

Replace with:

const {
    currentDrawdown,
    maximumAllowedDrawdown,
    riskPerTrade,
    marginUsage,
    liquidationWarning,
    netExposure,
    riskStatus
} = useTradingStore();

Render directly from the store.

------------------------------------------------------------------------------

4.

Repeat this migration for every remaining dashboard panel.

Examples include:

Portfolio

Market Overview

Execution

Statistics

Vault

AI

Infrastructure

Telemetry

Broker

Orders

Positions

Every panel must consume the shared Zustand store.

------------------------------------------------------------------------------

5.

No dashboard component may:

- create a WebSocket
- calculate backend metrics
- poll telemetry independently
- duplicate business logic

All runtime values originate from the backend.

------------------------------------------------------------------------------

SUCCESS CRITERIA

✓ Exactly one WebSocket connection exists.

✓ Shared WebSocket manager updates Zustand.

✓ RiskManagementPanel contains no networking logic.

✓ Dashboard panels consume only Zustand state.

✓ All business metrics originate from the backend.

✓ Global Trading State remains the single source of truth.

============================================================================
