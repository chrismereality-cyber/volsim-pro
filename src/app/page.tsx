'use client';

import React from "react";
import { useTradingStore } from "../../store/useTradingStore";
import { useGlobalState } from "../context/GlobalStateContext";

export default function Page() {
    const { connected } = useGlobalState();

    const balance = useTradingStore(
        state => state.balance
    );

    const equity = useTradingStore(
        state => state.equity
    );

    const floatingPl = useTradingStore(
        state => state.floatingPl
    );

    const currentDrawdown = useTradingStore(
        state => state.currentDrawdown
    );

    const maxDrawdown = useTradingStore(
        state => state.maxDrawdown
    );

    const winRate = useTradingStore(
        state => state.winRate
    );

    const profitFactor = useTradingStore(
        state => state.profitFactor
    );

    const expectancy = useTradingStore(
        state => state.expectancy
    );

    const sharpeRatio = useTradingStore(
        state => state.sharpeRatio
    );

    const totalTrades = useTradingStore(
        state => state.totalTrades
    );

    const positions = useTradingStore(
        state => state.positions
    );

    const riskPerTrade = useTradingStore(
        state => state.riskPerTrade
    );

    const marginUsage = useTradingStore(
        state => state.marginUsage
    );

    const liquidationWarning = useTradingStore(
        state => state.liquidationWarning
    );

    const portfolioValue = useTradingStore(
        state => state.portfolioValue
    );

    const netExposure = useTradingStore(
        state => state.netExposure
    );

    const valueAtRisk = useTradingStore(
        state => state.valueAtRisk
    );

    const riskStatus = useTradingStore(
        state => state.riskStatus
    );

    const hedgingSignals = useTradingStore(
        state => state.hedgingSignals
    );

    return (
        <main className="min-h-screen bg-slate-950 p-8 text-slate-100 font-mono">
            <div className="max-w-7xl mx-auto space-y-6">

                <header className="border-b border-slate-800 pb-5 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black tracking-wider text-white">
                            VOLSIM-PRO TERMINAL
                        </h1>

                        <p className="text-xs text-slate-500 mt-1">
                            GLOBAL TRADING STATE COMMAND CENTRE
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`w-3 h-3 rounded-full ${
                                connected
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-red-500"
                            }`}
                        />

                        <span className="text-xs text-slate-400">
                            {connected
                                ? "TRADING STATE ONLINE"
                                : "CONNECTING"}
                        </span>
                    </div>
                </header>

                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500">
                            BALANCE
                        </p>

                        <p className="text-2xl font-black mt-2">
                            ${Number(balance).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500">
                            EQUITY
                        </p>

                        <p className="text-2xl font-black mt-2 text-emerald-400">
                            ${Number(equity).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500">
                            FLOATING P/L
                        </p>

                        <p className="text-2xl font-black mt-2">
                            ${Number(floatingPl).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                        <p className="text-xs text-slate-500">
                            PORTFOLIO VALUE
                        </p>

                        <p className="text-2xl font-black mt-2 text-amber-400">
                            ${Number(portfolioValue).toFixed(2)}
                        </p>
                    </div>

                </section>

                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black tracking-wider text-amber-400">
                            RISK MANAGEMENT
                        </h2>

                        <span
                            className={`px-3 py-1 rounded-full text-xs ${
                                liquidationWarning
                                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            }`}
                        >
                            {liquidationWarning
                                ? "LIQUIDATION WARNING"
                                : "SYSTEM SECURE"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                CURRENT DRAWDOWN
                            </p>

                            <p className="text-xl font-bold text-red-400 mt-2">
                                {Number(currentDrawdown).toFixed(2)}%
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                MAXIMUM DRAWDOWN
                            </p>

                            <p className="text-xl font-bold mt-2">
                                {Number(maxDrawdown).toFixed(2)}%
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                NET EXPOSURE
                            </p>

                            <p className="text-xl font-bold text-sky-400 mt-2">
                                ${Number(netExposure).toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                RISK / TRADE
                            </p>

                            <p className="text-xl font-bold text-indigo-400 mt-2">
                                {Number(riskPerTrade).toFixed(2)}%
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                MARGIN USAGE
                            </p>

                            <p className="text-xl font-bold text-amber-300 mt-2">
                                {Number(marginUsage).toFixed(2)}%
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                OPEN POSITIONS
                            </p>

                            <p className="text-xl font-bold mt-2">
                                {Array.isArray(positions)
                                    ? positions.length
                                    : 0}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                RISK STATUS
                            </p>

                            <p className="text-xl font-bold text-emerald-400 mt-2">
                                {riskStatus}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                VALUE AT RISK
                            </p>

                            <p className="text-xl font-bold text-purple-400 mt-2">
                                ${Number(valueAtRisk).toFixed(2)}
                            </p>
                        </div>

                    </div>
                </section>

                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <h2 className="text-xl font-black tracking-wider text-amber-400 mb-5">
                        PERFORMANCE ENGINE
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                WIN RATE
                            </p>
                            <p className="text-xl font-bold mt-2">
                                {Number(winRate).toFixed(2)}%
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                PROFIT FACTOR
                            </p>
                            <p className="text-xl font-bold mt-2">
                                {Number(profitFactor).toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                EXPECTANCY
                            </p>
                            <p className="text-xl font-bold mt-2 text-emerald-400">
                                {Number(expectancy).toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                SHARPE
                            </p>
                            <p className="text-xl font-bold mt-2">
                                {Number(sharpeRatio).toFixed(2)}
                            </p>
                        </div>

                        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                            <p className="text-xs text-slate-500">
                                TOTAL TRADES
                            </p>
                            <p className="text-xl font-bold mt-2">
                                {Number(totalTrades)}
                            </p>
                        </div>

                    </div>
                </section>

                <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">

                    <div className="flex justify-between items-center mb-5">
                        <h2 className="text-xl font-black tracking-wider text-amber-400">
                            HEDGE / RISK SIGNALS
                        </h2>

                        <span className="text-xs text-slate-500">
                            {Array.isArray(hedgingSignals)
                                ? hedgingSignals.length
                                : 0} SIGNALS
                        </span>
                    </div>

                    {Array.isArray(hedgingSignals) &&
                    hedgingSignals.length > 0 ? (
                        <div className="space-y-2">
                            {hedgingSignals.map(
                                (signal: any, index: number) => (
                                    <div
                                        key={index}
                                        className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex justify-between"
                                    >
                                        <span>
                                            {signal.asset ?? "UNKNOWN"}
                                        </span>

                                        <span className="text-amber-400">
                                            {signal.action ?? signal.status ?? "WAIT"}
                                        </span>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500">
                            No active hedging signals.
                        </div>
                    )}

                </section>

            </div>
        </main>
    );
}
