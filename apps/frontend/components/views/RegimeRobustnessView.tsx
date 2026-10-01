"use client";

import {
    Activity,
    Shield,
    AlertOctagon,
    BarChart3,
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

    const regimeIsKnown =
        Boolean(riskStatus);

    const marginStable =
        marginViability >= 70;

    return (
        <div className="telemetry-shell space-y-6">

            <header className="border-b border-zinc-800 pb-5">

                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

                    <div>
                        <div className="telemetry-sublabel">
                            RISK / REGIME INTELLIGENCE
                        </div>

                        <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                            Regime &amp; Portfolio Robustness
                        </h1>

                        <p className="mt-2 text-sm font-medium text-zinc-400">
                            Real-time regime monitoring and deterministic portfolio stress analysis.
                        </p>
                    </div>

                    <div
                        className={`telemetry-status ${
                            connected
                                ? "telemetry-status-online"
                                : "telemetry-status-danger"
                        }`}
                    >
                        <span
                            className={`mr-2 inline-block h-2 w-2 rounded-full ${
                                connected
                                    ? "bg-emerald-400 animate-pulse"
                                    : "bg-rose-500"
                            }`}
                        />

                        CORE ENGINE:
                        {" "}
                        {connected
                            ? "ONLINE"
                            : "LINK OFFLINE"}
                    </div>

                </div>

            </header>

            <section>

                <div className="telemetry-section">
                    RISK STATE TELEMETRY
                </div>

                <div className="telemetry-grid mt-3 grid-cols-1 md:grid-cols-3">

                    <div className="telemetry-card">

                        <div className="flex items-center justify-between gap-3">

                            <div className="telemetry-label flex items-center gap-2">
                                <Activity className="h-4 w-4 text-emerald-400" />
                                CURRENT PHASE REGIME
                            </div>

                            <span
                                className={`telemetry-status ${
                                    regimeIsKnown
                                        ? "telemetry-status-online"
                                        : "telemetry-status-neutral"
                                }`}
                            >
                                {regimeIsKnown
                                    ? "DETECTED"
                                    : "UNKNOWN"}
                            </span>

                        </div>

                        <div className="telemetry-value-lg mt-4 text-emerald-400">
                            {regimeName}
                        </div>

                        <div className="mt-3 text-xs leading-5 text-zinc-500">
                            Current risk-derived volatility state from centralized
                            portfolio telemetry.
                        </div>

                    </div>

                    <div className="telemetry-card">

                        <div className="telemetry-label flex items-center gap-2">
                            <Shield className="h-4 w-4 text-sky-400" />
                            MARGIN VIABILITY
                        </div>

                        <div className="telemetry-value-lg mt-4 text-white">
                            {marginViability.toFixed(2)}%
                        </div>

                        <div className="mt-3 flex items-center justify-between">

                            <span
                                className={`telemetry-status ${
                                    marginStable
                                        ? "telemetry-status-online"
                                        : "telemetry-status-warning"
                                }`}
                            >
                                {marginStable
                                    ? "STABLE"
                                    : "COMPRESSED"}
                            </span>

                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                DERIVED TELEMETRY
                            </span>

                        </div>

                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-900">

                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(0, marginViability)
                                    )}%`,
                                }}
                            />

                        </div>

                    </div>

                    <div className="telemetry-card">

                        <div className="telemetry-label flex items-center gap-2">
                            <AlertOctagon className="h-4 w-4 text-amber-400" />
                            1-DAY PARAMETRIC VaR
                        </div>

                        <div className="telemetry-value-lg mt-4 text-amber-400">
                            ${var1d95.toFixed(2)}
                        </div>

                        <div className="mt-3 flex items-center justify-between">

                            <span className="telemetry-status telemetry-status-warning">
                                95% BOUNDARY
                            </span>

                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                CURRENT VaR
                            </span>

                        </div>

                    </div>

                </div>

            </section>

            <section>

                <div className="flex items-center justify-between gap-4">

                    <div>
                        <div className="telemetry-section">
                            MACRO STRESS MATRIX
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                            Deterministic scenario references against the current risk telemetry.
                        </p>
                    </div>

                    <BarChart3 className="hidden h-5 w-5 text-emerald-500 sm:block" />

                </div>

                <div className="telemetry-card mt-3 overflow-hidden p-0">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[760px] text-left">

                            <thead>

                                <tr className="border-b border-zinc-800 bg-zinc-950/80">

                                    <th className="telemetry-label px-4 py-4">
                                        SCENARIO
                                    </th>

                                    <th className="telemetry-label px-4 py-4">
                                        ASSET SHOCK VECTOR
                                    </th>

                                    <th className="telemetry-label px-4 py-4 text-right">
                                        PROJECTED BALANCE IMPACT
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-zinc-900">

                                <tr className="transition-colors hover:bg-zinc-900/40">

                                    <td className="px-4 py-5">

                                        <div className="text-sm font-black uppercase tracking-wide text-white">
                                            Systemic Liquidity Squeeze
                                        </div>

                                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                                            Stress Scenario 01
                                        </div>

                                    </td>

                                    <td className="px-4 py-5">

                                        <div className="text-sm font-semibold text-zinc-300">
                                            Gold −12.5%
                                        </div>

                                        <div className="mt-1 text-xs text-zinc-500">
                                            Equities −20%
                                        </div>

                                    </td>

                                    <td className="px-4 py-5 text-right">

                                        <div className="text-lg font-black text-rose-400">
                                            ${varianceSigma.toFixed(2)}
                                        </div>

                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                            Current VaR-derived readout
                                        </div>

                                    </td>

                                </tr>

                                <tr className="transition-colors hover:bg-zinc-900/40">

                                    <td className="px-4 py-5">

                                        <div className="text-sm font-black uppercase tracking-wide text-white">
                                            Black Swan Tail-Risk Volatility
                                        </div>

                                        <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                                            Stress Scenario 02
                                        </div>

                                    </td>

                                    <td className="px-4 py-5">

                                        <div className="text-sm font-semibold text-zinc-300">
                                            Volatility Index +150%
                                        </div>

                                        <div className="mt-1 text-xs text-zinc-500">
                                            Breakout volatility shock
                                        </div>

                                    </td>

                                    <td className="px-4 py-5 text-right">

                                        <div className="text-lg font-black text-rose-400">
                                            ${var1d95.toFixed(2)}
                                        </div>

                                        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                                            Current VaR-derived readout
                                        </div>

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </div>

            </section>

            <section>

                <div className="telemetry-section">
                    ROBUSTNESS INTERPRETATION
                </div>

                <div className="telemetry-card mt-3">

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                        <div>
                            <div className="telemetry-label">
                                ENGINE LINK
                            </div>

                            <div className="telemetry-value-md mt-2">
                                {connected
                                    ? "CONNECTED"
                                    : "OFFLINE"}
                            </div>
                        </div>

                        <div>
                            <div className="telemetry-label">
                                REGIME SOURCE
                            </div>

                            <div className="telemetry-value-md mt-2">
                                RISK TELEMETRY
                            </div>
                        </div>

                        <div>
                            <div className="telemetry-label">
                                STRESS MODEL
                            </div>

                            <div className="telemetry-value-md mt-2">
                                DETERMINISTIC
                            </div>
                        </div>

                    </div>

                    <div className="telemetry-divider my-5" />

                    <p className="text-xs leading-5 text-zinc-500">
                        The displayed stress scenarios are presentation-level
                        deterministic references using the existing centralized
                        risk telemetry. They are not represented as a live
                        macroeconomic simulation or independent stress engine.
                    </p>

                </div>

            </section>

        </div>
    );
}
