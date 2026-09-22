/**
 * VolSim-Pro centralized frontend network configuration.
 *
 * API:
 *   http://127.0.0.1:10000
 *
 * WebSocket:
 *   ws://127.0.0.1:10000
 *
 * All frontend components should import API_BASE / WS_BASE
 * from this module instead of hard-coding connection URLs.
 */

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:10000";

const WS_BASE =
    process.env.NEXT_PUBLIC_WS_URL ||
    "ws://127.0.0.1:10000";

export { API_BASE, WS_BASE };

export const TRADING_STATE_WS =
    `${WS_BASE}/ws/trading-state`;

export const VAULT_WS =
    `${WS_BASE}/ws/vault`;

export const DASHBOARD_WS =
    `${WS_BASE}/ws/dashboard`;
