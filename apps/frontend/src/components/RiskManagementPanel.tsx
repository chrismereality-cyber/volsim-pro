'use client';
﻿import { useTradingStore } from "../../store/useTradingStore";



import { useEffect, useState } from "react";
import { tradingSocket } from "../../lib/TradingSocketManager";

export default function RiskManagementPanel() {
    const [riskData, setRiskData] = useState({
        current_drawdown: 0.0,
        maximum_allowed_drawdown: 5.0,
        risk_exposure: 0.0,
        risk_per_trade: 1.0,
        hedge_status: "INACTIVE",
        margin_usage: 0.0,
        liquidation_warning: false
    });
    const [connected, setConnected] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");


useEffect(() => {

    tradingSocket.connect(
        "/ws/trading-state",
        (payload:any) => {

            if (!payload?.risk) {
                return;
            }

            setRiskData(payload.risk);

            setConnected(true);
        }
    );


    return () => {
};

}, []);


    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-2xl font-mono w-full">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold tracking-wider text-amber-400">RISK MANAGEMENT</h3>
                    <span className="inline-block w-3 h-3 rounded-full"></span>
                    <span className="text-xs text-slate-400">{connected ? 'LIVE TELEMETRY ACTIVE' : 'RECONNECTING...'}</span>
                </div>
                <span className="px-3 py-1 text-xs rounded-full font-semibold">
                    {riskData.liquidation_warning ? 'LIQUIDATION WARNING' : 'SYSTEM SECURE'}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Current Drawdown</span>
                    <span className="text-2xl font-black text-red-400">{riskData.current_drawdown.toFixed(2)}%</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Maximum Drawdown</span>
                    <span className="text-2xl font-black text-slate-200">{riskData.maximum_allowed_drawdown.toFixed(2)}%</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Risk Exposure</span>
                    <span className="text-xl font-bold text-slate-200"></span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Risk per Trade</span>
                    <span className="text-xl font-bold text-sky-400">{riskData.risk_per_trade.toFixed(2)}%</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Hedge Status</span>
                    <span className="text-lg font-bold text-indigo-400">{riskData.hedge_status}</span>
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Margin Usage</span>
                    <span className="text-xl font-bold text-amber-300">{riskData.margin_usage.toFixed(2)}%</span>
                </div>
            </div>
        </div>
    );
}
