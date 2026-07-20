import { useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';

export function useDataStream() {
  const updateMetrics = useTradingStore((state) => state.updateMetrics);

  useEffect(() => {
    const socketUrl = 'ws://127.0.0.1:10000/ws/trading-state';
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        updateMetrics({ isFastApiConnected: true, isBrokerConnected: true });
      };

      socket.onmessage = (event) => {
        try {
          const rawPayload = JSON.parse(event.data);
          updateMetrics({
            balance: rawPayload.balance ?? 0,
            equity: rawPayload.equity ?? 0,
            floatingPl: rawPayload.floatingPl ?? 0,
            dailyPl: rawPayload.dailyPl ?? 0,
            weeklyPl: rawPayload.weeklyPl ?? 0,
            monthlyPl: rawPayload.monthlyPl ?? 0,
            winRate: rawPayload.winRate ?? 0,
            profitFactor: rawPayload.profitFactor ?? 0,
            expectancy: rawPayload.expectancy ?? 0,
            sharpeRatio: rawPayload.sharpeRatio ?? 0,
            maxDrawdown: rawPayload.maxDrawdown ?? 0,
            currentDrawdown: rawPayload.currentDrawdown ?? 0,
            totalTrades: rawPayload.totalTrades ?? 0,
            totalNetProfit: rawPayload.totalNetProfit ?? 0,
            cagr: rawPayload.cagr ?? 0,
            avgDurationMinutes: rawPayload.avgDurationMinutes ?? 0,
            positions: rawPayload.positions ?? [],
          });
        } catch (err) {
          console.error('Error parsing inbound WebSocket data frame:', err);
        }
      };

      socket.onclose = () => {
        updateMetrics({ isFastApiConnected: false, isBrokerConnected: false });
        reconnectTimeout = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      if (socket) {
        socket.onclose = null; // Prevent timeout fire on cleanup
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, []); // Empty dependency array keeps the WebSocket instance completely stable
}
