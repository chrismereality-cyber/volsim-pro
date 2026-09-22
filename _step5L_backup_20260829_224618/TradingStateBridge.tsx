'use client';

import { useEffect } from 'react';
import { TRADING_STATE_WS } from '../apiConfig';
import { useTradingStore } from '../../store/useTradingStore';

export function TradingStateBridge() {
  const setTradingState = useTradingStore(
    (state) => state.setTradingState
  );

  const setConnected = useTradingStore(
    (state) => state.setConnected
  );

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      try {
        ws = new WebSocket(TRADING_STATE_WS);

        ws.onopen = () => {
          if (cancelled) return;

          console.info(
            '[VolSim] Central trading-state WebSocket connected:',
            TRADING_STATE_WS
          );

          setConnected(true);
        };

        ws.onmessage = (event) => {
          if (cancelled) return;

          try {
            const incoming = JSON.parse(event.data);

            /*
             * The backend is the source of truth.
             *
             * Preserve the Zustand contract while allowing
             * the backend to evolve its payload structure.
             */
            const data =
              incoming?.data ??
              incoming?.state ??
              incoming;

            if (!data || typeof data !== 'object') {
              console.warn(
                '[VolSim] Ignoring invalid trading-state payload:',
                incoming
              );
              return;
            }

            setTradingState(data);
          } catch (error) {
            console.error(
              '[VolSim] Failed to parse trading-state payload:',
              error
            );
          }
        };

        ws.onerror = (error) => {
          if (cancelled) return;

          console.error(
            '[VolSim] Central trading-state WebSocket error:',
            error
          );

          setConnected(false);
        };

        ws.onclose = () => {
          if (cancelled) return;

          setConnected(false);

          console.warn(
            '[VolSim] Central trading-state WebSocket disconnected.'
          );

          reconnectTimer = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        if (cancelled) return;

        console.error(
          '[VolSim] Failed to create trading-state WebSocket:',
          error
        );

        setConnected(false);

        reconnectTimer = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    connect();

    return () => {
      cancelled = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (ws) {
        ws.close();
      }
    };
  }, [setConnected, setTradingState]);

  return null;
}
