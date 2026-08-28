"use client";

import { useEffect } from "react";
import { tradingSocket } from "../lib/TradingSocketManager";
import { useTradingStore } from "../store/useTradingStore";

export function useDataStream() {

    const updateTradingState = useTradingStore(
        state => state.updateTradingState
    );

    useEffect(() => {

        console.log(
            "[DATA STREAM] Connecting to shared TradingSocketManager"
        );

        tradingSocket.connect("/ws/trading-state");

        const unsubscribe = tradingSocket.subscribe(
            (payload: any) => {

                if (!payload) {
                    return;
                }

                try {

                    updateTradingState(payload);

                } catch (error) {

                    console.error(
                        "[DATA STREAM] Trading state update failed",
                        error
                    );

                }

            }
        );

        return () => {

            unsubscribe();

            console.log(
                "[DATA STREAM] Shared socket subscription removed"
            );

        };

    }, [updateTradingState]);
}
