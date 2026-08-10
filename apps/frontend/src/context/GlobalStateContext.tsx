'use client';

import React, {
    createContext,
    useContext,
    useEffect,
} from "react";

import {
    tradingSocket,
} from "../../lib/TradingSocketManager";

import {
    useTradingStore,
} from "../../store/useTradingStore";

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

    const updateTradingState =
        useTradingStore(
            state => state.updateTradingState
        );

    useEffect(() => {

        console.log(
            "[GLOBAL STATE] Subscribing to shared TradingSocketManager"
        );

        tradingSocket.connect(
            "/ws/trading-state"
        );

        const unsubscribe =
            tradingSocket.subscribe(
                (payload) => {

                    try {

                        updateTradingState(payload);

                    } catch (error) {

                        console.error(
                            "[GLOBAL STATE] Payload update failed",
                            error
                        );

                    }

                }
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
                connected: true,
            }}
        >
            {children}
        </GlobalStateContext.Provider>
    );

};

export const useGlobalState = () =>
    useContext(GlobalStateContext);
