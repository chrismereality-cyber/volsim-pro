'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { tradingSocket } from '../../lib/TradingSocketManager';
import { useTradingStore } from '../../store/useTradingStore';
import { useAuth } from '../auth/AuthProvider';

interface GlobalStateContextValue {
    connected: boolean;
}

const GlobalStateContext = createContext<GlobalStateContextValue>({
    connected: false,
});

interface GlobalStateProviderProps {
    children: React.ReactNode;
}

export const GlobalStateProvider = ({
    children,
}: GlobalStateProviderProps) => {
    const updateTradingState = useTradingStore(
        (state) => state.updateTradingState
    );

    const {
        isAuthenticated,
        isLoading,
        accessToken,
    } = useAuth();

    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (
            isLoading ||
            !isAuthenticated ||
            !accessToken
        ) {
            tradingSocket.disconnect();
            setConnected(false);
            return;
        }

        console.log(
            '[GLOBAL STATE] Starting centralized TradingSocketManager'
        );

        const unsubscribe = tradingSocket.subscribe((payload: any) => {
            if (!payload) return;

            if (payload.__socket_status === 'CONNECTED') {
                setConnected(true);
                return;
            }

            if (payload.__socket_status === 'DISCONNECTED') {
                setConnected(false);
                return;
            }

            const data = payload?.data ?? payload?.state ?? payload;

            if (!data || typeof data !== 'object') {
                console.warn(
                    '[GLOBAL STATE] Ignoring invalid trading-state payload',
                    payload
                );
                return;
            }

            try {
                updateTradingState(data);
            } catch (error) {
                console.error(
                    '[GLOBAL STATE] Trading state update failed',
                    error
                );
            }
        });

        tradingSocket.connect(
            '/ws/trading-state',
            accessToken,
        );

        return () => {
            unsubscribe();
            tradingSocket.disconnect();
            setConnected(false);

            console.log(
                '[GLOBAL STATE] TradingSocketManager subscription removed'
            );
        };
    }, [
        isAuthenticated,
        isLoading,
        accessToken,
    ]);

    return (
        <GlobalStateContext.Provider value={{ connected }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => useContext(GlobalStateContext);

