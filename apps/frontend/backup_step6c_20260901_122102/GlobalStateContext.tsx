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
            "[GLOBAL STATE] Starting shared TradingSocketManager"
        );

        const unsubscribe = tradingSocket.subscribe(
            (payload: any) => {
                if (!payload) {
                    return;
                }

                if (payload.__socket_status === "CONNECTED") {
                    console.log(
                        "[GLOBAL STATE] Trading WebSocket CONNECTED"
                    );

                    setConnected(true);
                    return;
                }

                if (payload.__socket_status === "DISCONNECTED") {
                    console.log(
                        "[GLOBAL STATE] Trading WebSocket DISCONNECTED"
                    );

                    setConnected(false);
                    return;
                }

                try {
                    updateTradingState(payload);
                    setConnected(true);
                } catch (error) {
                    console.error(
                        "[GLOBAL STATE] Trading state update failed",
                        error
                    );
                }
            }
        );

        tradingSocket.connect("/ws/trading-state");

        return () => {
            unsubscribe();

            console.log(
                "[GLOBAL STATE] Shared TradingSocketManager subscription removed"
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
