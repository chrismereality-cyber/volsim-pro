/**
 * VolSim-Pro Legacy Trading State Client
 *
 * DEPRECATED.
 *
 * Trading-state WebSocket ownership has been centralized in:
 *
 *   src/components/TradingStateBridge.tsx
 *
 * Do not create another /ws/trading-state connection here.
 */

export function startTradingStateClient() {
  console.warn(
    '[VolSim] startTradingStateClient() is deprecated. ' +
    'TradingStateBridge owns /ws/trading-state.'
  );

  return () => {
    // Intentionally empty.
    // Connection lifecycle belongs to TradingStateBridge.
  };
}
