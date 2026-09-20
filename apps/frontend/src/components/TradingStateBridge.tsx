'use client';

import { useEffect } from 'react';
import { tradingSocket } from '../../lib/TradingSocketManager';

/**
 * TradingStateBridge
 *
 * Compatibility bridge only.
 *
 * IMPORTANT:
 * This component MUST NOT create its own WebSocket.
 *
 * The single source of WebSocket ownership is:
 *
 *     lib/TradingSocketManager.ts
 *
 * GlobalStateContext subscribes to that manager and updates
 * the centralized Zustand trading store.
 *
 * This component exists only to preserve compatibility with
 * any existing imports while the application completes its
 * migration to the centralized architecture.
 */
export function TradingStateBridge() {
    useEffect(() => {
        /*
         * Intentionally do not create another WebSocket here.
         *
         * The manager is already owned by the centralized
         * GlobalStateContext.
         */
        return undefined;
    }, []);

    return null;
}

export default TradingStateBridge;
