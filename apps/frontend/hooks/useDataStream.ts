import { useEffect } from "react";
import { tradingSocket } from "../lib/TradingSocketManager";
import { useTradingStore } from "../store/useTradingStore";

export function useDataStream() {

    const updateTradingState =
        useTradingStore(
            (state) => state.updateTradingState
        );

    useEffect(() => {

        tradingSocket.connect(

            "/ws/trading-state",

            (payload) => {

                console.log(
                    "[LIVE PAYLOAD]",
                    payload
                );

                updateTradingState(payload);

            }

        );

        return () => {
};

    }, [updateTradingState]);

}
