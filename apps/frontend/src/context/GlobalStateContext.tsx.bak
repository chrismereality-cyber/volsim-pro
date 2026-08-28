'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import { tradingSocket } from "../../lib/TradingSocketManager";
import { useTradingStore } from "../../store/useTradingStore";

type GlobalStateContextValue = {
    connected: boolean;
};

const GlobalStateContext =
    createContext<GlobalStateContextValue>({
        connected: false,
    });

export const GlobalStateProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const updateTradingState = useTradingStore(
        state => state.updateTradingState
    );

    const [connected, setConnected] = useState(false);

    useEffect(() => {
        console.log(
            "[GLOBAL STATE] Connecting to shared TradingSocketManager"
        );

        const unsubscribe = tradingSocket.subscribe(
            (payload) => {
                try {
                    updateTradingState(payload);
                    setConnected(true);
                } catch (error) {
                    console.error(
                        "[GLOBAL STATE] Payload update failed",
                        error
                    );
                }
            }
        );

        tradingSocket.connect(
            "/ws/trading-state"
        );

        return () => {
            unsubscribe();

            console.log(
                "[GLOBAL STATE] Shared socket subscription removed"
            );
        };
    }, [updateTradingState]);

    return (
        <GlobalStateContext.Provider
            value={{
                connected,
            }}
        >
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () =>
    useContext(GlobalStateContext);
