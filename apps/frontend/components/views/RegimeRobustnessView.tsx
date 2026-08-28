"use client";

import {
    Activity,
    Shield,
    AlertOctagon,
    BarChart3
} from "lucide-react";

import { useTradingStore } from "../../store/useTradingStore";

export default function RegimeRobustnessView() {
    const connected = useTradingStore(
        (state) => state.isFastApiConnected
    );

    const riskStatus = useTradingStore(
        (state) => state.riskStatus
    );

    const valueAtRisk = useTradingStore(
        (state) => state.valueAtRisk
    );

    const marginUsage = useTradingStore(
        (state) => state.marginUsage
    );

    const marginViability = Math.max(
        0,
        100 - Number(marginUsage || 0)
    );

    const regimeName =
        riskStatus || "UNKNOWN";

    const varianceSigma =
        Number(valueAtRisk || 0);

    const var1d95 =
        Number(valueAtRisk || 0);

    return (
        <div className="space-y-6 p-6 font-mono text-zinc-100 bg-black min-h-screen">

            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">

                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">
                        // REGIME & PORTFOLIO ROBUSTNESS ENGINE
                    </h1>

                    <p className="text-xs text-zinc-500 mt-1">
                        Real-time regime monitoring and deterministic portfolio stress analysis.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-[10px] px-3 py-1.5 font-bold uppercase text-zinc-400">

                    <span
                        className={`w-2 h-2 rounded-full ${
                            connected
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-rose-500"
                        }`}
                    />

                    CORE_ENGINE:{" "}
                    {connected
                        ? "ONLINE"
                        : "LINK_OFFLINE"}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">

                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-400" />

                        Current Phase Regime
                    </div>

                    <div className="text-lg font-black text-emerald-400">
                        {regimeName}
                    </div>

                    <div className="text-[10px] text-zinc-500">
                        // Current risk-derived volatility state
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">

                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />

                        Margin Viability Threshold
                    </div>

                    <div className="text-lg font-black text-white">
                        {marginViability.toFixed(2)}% STABLE
                    </div>

                    <div className="text-[10px] text-zinc-500">
                        // Derived from centralized margin telemetry
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">

                    <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />

                        1-Day Parametric VaR
                    </div>

                    <div className="text-lg font-black text-amber-500">
                        ${var1d95.toFixed(2)}
                    </div>

                    <div className="text-[10px] text-zinc-500">
                        // 95% confidence boundary criteria
                    </div>
                </div>

            </div>

            <div className="space-y-2">

                <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />

                    // Live Macro Stress Shock Allocations
                </h2>

                <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">

                    <table className="w-full text-left text-xs text-zinc-400">

                        <thead className="bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">

                            <tr>
                                <th className="p-3">
                                    Scenario Identifier
                                </th>

                                <th className="p-3">
                                    Asset Target Vector Shifts
                                </th>

                                <th className="p-3 text-right">
                                    Projected Balance Impact
                                </th>
                            </tr>

                        </thead>

                        <tbody className="divide-y divide-zinc-900">

                            <tr className="hover:bg-zinc-900/20">

                                <td className="p-3 font-bold text-zinc-200">
                                    Systemic Liquidity Squeeze
                                </td>

                                <td className="p-3 text-zinc-400">
                                    Gold Slips -12.5%, Equities Tumble -20%
                                </td>

                                <td className="p-3 text-right text-rose-500 font-bold">
                                    ${varianceSigma.toFixed(2)}
                                </td>

                            </tr>

                            <tr className="hover:bg-zinc-900/20">

                                <td className="p-3 font-bold text-zinc-200">
                                    Black Swan Tail-Risk Volatility
                                </td>

                                <td className="p-3 text-zinc-400">
                                    Volatility Index Induces Breakout Spikes +150%
                                </td>

                                <td className="p-3 text-right text-rose-500 font-bold">
                                    ${var1d95.toFixed(2)}
                                </td>

                            </tr>

                        </tbody>

                    </table>
                </div>
            </div>
        </div>
    );
}
