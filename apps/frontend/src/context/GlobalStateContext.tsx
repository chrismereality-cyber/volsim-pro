'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { tradingSocket } from '../../lib/TradingSocketManager';
import { InstrumentRegistryClient } from '../../lib/InstrumentRegistryClient';
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

    const setInstrumentRegistry = useTradingStore(
        (state) => state.setInstrumentRegistry
    );

    useEffect(() => {
        if (
            isLoading ||
            !isAuthenticated ||
            !accessToken
        ) {
            return;
        }

        const authenticatedToken = accessToken;
        let cancelled = false;

        async function loadInstrumentRegistry() {
            try {
                const response =
                    await InstrumentRegistryClient.listMT5(
                        authenticatedToken,
                    );

                if (cancelled) {
                    return;
                }

                setInstrumentRegistry(
                    response.instruments,
                );

                console.log(
                    '[GLOBAL STATE] MT5 instrument registry loaded',
                    response.count,
                );
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    '[GLOBAL STATE] MT5 instrument registry load failed',
                    error,
                );
            }
        }

        void loadInstrumentRegistry();

        return () => {
            cancelled = true;
        };
    }, [
        isAuthenticated,
        isLoading,
        accessToken,
        setInstrumentRegistry,
    ]);
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




