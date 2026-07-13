'use client';
import React, { createContext, useContext, useEffect, useRef } from 'react';

const GlobalStateContext = createContext<any>(null);
const globalSockets: Record<string, WebSocket> = {};

export const GlobalStateProvider = ({ children }: { children: React.ReactNode }) => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const channels = ['trading-state', 'vault-state', 'robustness-state', 'risk-state'];
    
    channels.forEach((channel) => {
      // Updated to port 10000
      const ws = new WebSocket('ws://localhost:10000/ws/' + channel);
      ws.onopen = () => {
        console.log(channel + ' connected');
        ws.send(JSON.stringify({ action: 'handshake', type: 'init' }));
      };
      globalSockets[channel] = ws;
    });
  }, []);

  return (
    <GlobalStateContext.Provider value={{ sockets: globalSockets }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
