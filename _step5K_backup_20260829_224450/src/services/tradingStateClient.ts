/**
 * VolSim-Pro Trading State Client
 *
 * DEPRECATED:
 * WebSocket ownership has been centralized in TradingStateBridge.
 *
 * This compatibility module intentionally does not create a WebSocket.
 * Existing imports can remain temporarily without creating duplicate
 * connections.
 */

export function startTradingStateClient() {
  console.warn(
    '[VolSim] startTradingStateClient() is deprecated. ' +
    'TradingStateBridge is the single trading-state WebSocket owner.'
  );

  return () => {
    // Intentionally empty.
    // TradingStateBridge owns the connection lifecycle.
  };
}
