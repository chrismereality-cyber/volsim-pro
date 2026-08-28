"use client";

import { useTradingStore } from "../store/useTradingStore";

export function useDataStream() {
    return useTradingStore();
}
