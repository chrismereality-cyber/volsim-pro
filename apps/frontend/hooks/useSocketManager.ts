import { useEffect } from 'react';
import { useTradingStore } from '../store/useTradingStore';

export const useSocketManager = () => {
  useEffect(() => {
    const channels = ['trading', 'vault', 'robustness', 'risk'];
    const sockets: WebSocket[] = [];

    channels.forEach(channel => {
      const ws = new WebSocket(`ws://127.0.0.1:8080/ws/${channel}-state`);
      
      ws.onopen = () => {
        console.log(`Connected to ${channel}`);
        useTradingStore.getState().updateMetrics({ isFastApiConnected: true });
      };

      ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            useTradingStore.getState().updateMetrics({ [channel]: data });
        } catch (e) { console.error(`Parse error for ${channel}`, e); }
      };
      
      sockets.push(ws);
    });

    return () => sockets.forEach(s => s.close());
  }, []);
};
