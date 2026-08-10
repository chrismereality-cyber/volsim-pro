'use client';

import React from "react";
import { useTradingStore } from "../store/useTradingStore";

const PortfolioOverviewView = () => {
    const connected = useTradingStore((state) => state.isFastApiConnected);
    const balance = useTradingStore((state) => state.balance);
    const equity = useTradingStore((state) => state.equity);
    const floatingPl = useTradingStore((state) => state.floatingPl);

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-bold">
                Portfolio Overview
            </h3>

            <div>
                <strong>Connection:</strong>{" "}
                {connected ? "FASTAPI ONLINE" : "DISCONNECTED"}
            </div>

            <div>
                <strong>Balance:</strong>{" "}
                {balance ?? "--"}
            </div>

            <div>
                <strong>Equity:</strong>{" "}
                {equity ?? "--"}
            </div>

            <div>
                <strong>Floating P/L:</strong>{" "}
                {floatingPl ?? "--"}
            </div>
        </div>
    );
};

export default PortfolioOverviewView;
