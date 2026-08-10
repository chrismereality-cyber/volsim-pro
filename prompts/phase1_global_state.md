# Phase 1 — Enterprise Global State Expansion

Objective

Extend the existing GlobalStateOrchestrator located at:

src/services/global_state_service.py

Do NOT replace it.

Do NOT introduce another GlobalState service.

Treat this file as the single source of truth for the enterprise dashboard.

Requirements

- Preserve every existing subsystem.
- Never remove existing keys.
- Expand subsystem dictionaries only.
- Keep backward compatibility.
- Use existing services whenever available.
- Leave TODO placeholders for unavailable services.
- Do not perform business calculations inside WebSocket routes.
- Continue publishing only:

global_state_orchestrator.snapshot()

through

/ws/trading-state

No additional trading-state websocket routes may be introduced.

The orchestrator remains responsible for composing:

- account_state
- market_state
- position_state
- order_state
- terminal_state
- portfolio_state
- execution_state
- risk_state
- statistics_state
- vault_state
- ai_state
- telemetry_state
- timestamp

Future services should plug into the orchestrator rather than bypassing it.
