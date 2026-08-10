import React from 'react';
import { TradingApiClient } from "../../lib/TradingApiClient";

async function getTelemetry() {
    try {
        const res = await TradingApiClient.get('/api/telemetry');
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    }
}

export default async function Page() {
    const data = await getTelemetry();

    const risk = data?.risk_state || {};
    const pos = data?.position_state || {};

    const riskData = {
        current_drawdown: Number(risk.current_drawdown ?? 0.0),
        maximum_allowed_drawdown: Number(risk.maximum_allowed_drawdown ?? 5.0),
        risk_exposure: Number(pos.total_exposure ?? 0.0),
        risk_per_trade: Number(risk.risk_per_trade ?? 1.0),
        hedge_status: risk.hedge_status ?? "INACTIVE",
        margin_usage: Number(risk.margin_usage ?? 0.0),
        liquidation_warning: Boolean(risk.liquidation_warning ?? false)
    };

    const isConnected = data !== null;

    return (
        <main className="min-h-screen bg-slate-950 p-8 flex flex-col items-center justify-start font-mono text-slate-100">
            <div className="w-full max-w-6xl space-y-8">
                <header className="border-b border-slate-800 pb-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-wider">VOLSIM-PRO TERMINAL</h1>
                        <p className="text-xs text-slate-400 mt-1">Live Algorithmic Bridge & Risk Telemetry (Server-Rendered)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-block w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="text-xs text-slate-400">{isConnected ? 'BACKEND CONNECTED' : 'BACKEND OFFLINE'}</span>
                    </div>
                </header>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl w-full">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                        <h3 className="text-xl font-bold tracking-wider text-amber-400">RISK MANAGEMENT</h3>
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${riskData.liquidation_warning ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}>
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
                            <span className="text-xl font-bold text-slate-200">${riskData.risk_exposure.toFixed(2)}</span>
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
            </div>
        </main>
    );
}
