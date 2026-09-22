import React, { createContext, useContext, useEffect, useState } from 'react';
import { WS_BASE } from '../apiConfig';

const GlobalStateContext = createContext(null);

export const GlobalStateProvider = ({ children }) => {
    const [globalState, setGlobalState] = useState({});

    useEffect(() => {
        const wsUrl = WS_BASE ? ${WS_BASE}/ws/trading-state : 'ws://127.0.0.1:10000/ws/trading-state';
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setGlobalState(data);
            } catch (err) {
                console.error("Failed to parse global state WebSocket message", err);
            }
        };

        return () => {
            ws.close();
        };
    }, []);

    return (
        <GlobalStateContext.Provider value={globalState}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => useContext(GlobalStateContext);
