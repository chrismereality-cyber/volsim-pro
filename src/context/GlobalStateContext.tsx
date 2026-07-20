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
      if (!globalSockets[channel]) {
        import { WS_BASE } from '../apiConfig'; globalSockets[channel] = new WebSocket(\\/ws/\\);
        
        globalSockets[channel].onopen = () => {
            console.log('Connected to ' + channel);
            // Send handshake signal immediately upon connection
            globalSockets[channel].send(JSON.stringify({ action: 'handshake', type: 'init' }));
        };
      }
    });
  }, []);

  return (
    <GlobalStateContext.Provider value={{ sockets: globalSockets }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

export const useGlobalState = () => useContext(GlobalStateContext);
