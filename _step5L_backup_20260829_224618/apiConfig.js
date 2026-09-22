/**
 * VolSim-Pro API Configuration
 *
 * Central configuration for frontend communication
 * with the VolSim-Pro backend.
 *
 * WebSocket ownership:
 *   TradingStateBridge.tsx
 *
 * State ownership:
 *   Zustand / store/useTradingStore.ts
 */

const DEFAULT_HTTP_BASE_URL = 'http://127.0.0.1:10000';

const DEFAULT_WS_BASE_URL = 'ws://127.0.0.1:10000';

const configuredHttpBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  DEFAULT_HTTP_BASE_URL;

const configuredWsBaseUrl =
  process.env.NEXT_PUBLIC_WS_BASE_URL ||
  DEFAULT_WS_BASE_URL;

export const API_BASE_URL =
  configuredHttpBaseUrl.replace(/\/+$/, '');

export const WS_BASE_URL =
  configuredWsBaseUrl.replace(/\/+$/, '');

export const TRADING_STATE_WS =
  `${WS_BASE_URL}/ws/trading-state`;

export default API_BASE_URL;
