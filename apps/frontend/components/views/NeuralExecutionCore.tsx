'use client';

import React from 'react';
import { BrainCircuit, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useTradingStore } from '../../store/useTradingStore';

type InstrumentState = {
    signal?: string | null;
    confidence?: number | null;
    position?: number | null;
    risk?: number | null;
    pnl?: number | null;
    status?: string | null;
    decision?: string | null;
    reason?: string | null;
};

const EMPTY_NEURAL_EXECUTION: NeuralExecutionState = {};

type NeuralExecutionState = {
    instruments?: Record<string, InstrumentState>;
    vfia?: {
        status?: string | null;
        regime?: string | null;
        assessment?: string | null;
        decision?: string | null;
        confidence?: number | null;
        reason?: string | null;
    };
};

function displayValue(
    value: unknown,
    fallback = '—'
) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return fallback;
    }

    return String(value);
}

function percentValue(value: unknown) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '—';
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '—';
    }

    return `${number.toFixed(1)}%`;
}

function moneyValue(value: unknown) {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return '—';
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return '—';
    }

    return `$${number.toFixed(2)}`;
}

function InstrumentCard({
    symbol,
    data,
}: {
    symbol: string;
    data: InstrumentState;
}) {
    const signal =
        data.signal ??
        data.decision ??
        'NO LIVE DECISION';

    const signalClass =
        signal === 'BUY'
            ? 'telemetry-positive'
            : signal === 'SELL'
                ? 'telemetry-negative'
                : 'text-white';

    const pnlNumber = Number(data.pnl ?? 0);

    const pnlClass =
        Number.isFinite(pnlNumber)
            ? pnlNumber > 0
                ? 'telemetry-positive'
                : pnlNumber < 0
                    ? 'telemetry-negative'
                    : 'text-white'
            : 'text-white';

    const status =
        displayValue(data.status, 'STANDBY').toUpperCase();

    return (
        <div className="telemetry-card p-5">

            {/* INSTRUMENT HEADER */}
            <div className="mb-5 flex items-center justify-between border-b border-zinc-900 pb-4">

                <div>
                    <div className="text-xl font-black tracking-[0.16em] text-white">
                        {symbol}
                    </div>

                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        NEURAL INSTRUMENT STATE
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <Activity className="h-5 w-5 text-emerald-400" />
                </div>

            </div>

            {/* PRIMARY TELEMETRY */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">

                <MetricRow
                    label="SIGNAL"
                    value={signal}
                    valueClass={signalClass}
                    primary
                />

                <MetricRow
                    label="CONFIDENCE"
                    value={percentValue(data.confidence)}
                    primary
                />

                <MetricRow
                    label="POSITION"
                    value={displayValue(data.position)}
                    primary
                />

                <MetricRow
                    label="RISK"
                    value={percentValue(data.risk)}
                    primary
                />

                <MetricRow
                    label="P&L"
                    value={moneyValue(data.pnl)}
                    valueClass={pnlClass}
                    primary
                />

                <MetricRow
                    label="STATUS"
                    value={status}
                    valueClass={
                        status === 'ONLINE'
                            ? 'telemetry-positive'
                            : status === 'ERROR' || status === 'FAILED'
                                ? 'telemetry-negative'
                                : 'text-white'
                    }
                    primary
                />

            </div>

            {/* INTELLIGENCE CONTEXT */}
            {data.reason && (
                <div className="mt-5 border-t border-zinc-900 pt-4">

                    <div className="telemetry-label mb-2">
                        INTELLIGENCE CONTEXT
                    </div>

                    <div className="rounded border border-zinc-900 bg-black/20 px-3 py-3 text-xs font-bold leading-relaxed tracking-wide text-zinc-300">
                        {data.reason}
                    </div>

                </div>
            )}

        </div>
    );
}

function MetricRow({
    label,
    value,
    valueClass = 'text-white',
    primary = false,
}: {
    label: string;
    value: string;
    valueClass?: string;
    primary?: boolean;
}) {
    return (
        <div className="min-w-0">

            <div className="telemetry-label">
                {label}
            </div>

            <div
                className={
                    primary
                        ? `mt-1 truncate text-lg font-black tracking-tight ${valueClass} md:text-xl`
                        : `mt-1 font-black ${valueClass}`
                }
            >
                {value}
            </div>

        </div>
    );
}

export default function NeuralExecutionCore() {
    const tradingState = useTradingStore();

    const aiDecisionBySymbol =
        tradingState.aiDecisionBySymbol ?? {};

    const aiExecutionBySymbol =
        tradingState.aiExecutionBySymbol ?? {};

    const executionRiskBySymbol =
        tradingState.executionRiskBySymbol ?? {};

    const orderBuilderBySymbol =
        tradingState.orderBuilderBySymbol ?? {};

    const aiExecutionOrchestratorBySymbol =
        tradingState.aiExecutionOrchestratorBySymbol ?? {};

    const buildInstrumentState = (
        symbol: string
    ): InstrumentState => {
        const decision =
            aiDecisionBySymbol[symbol] ?? {};

        const execution =
            aiExecutionBySymbol[symbol] ?? {};

        const risk =
            executionRiskBySymbol[symbol] ?? {};

        const order =
            orderBuilderBySymbol[symbol] ?? {};

        const orchestrator =
            aiExecutionOrchestratorBySymbol[symbol] ?? {};

        return {
            signal:
                decision.decision ??
                execution.execution_signal ??
                execution.signal ??
                null,

            confidence:
                decision.confidence ??
                execution.confidence ??
                null,

            position:
                order.position ??
                null,

            risk:
                risk.risk ??
                risk.exposure ??
                null,

            pnl:
                order.pnl ??
                null,

            status:
                execution.status ??
                orchestrator.status ??
                null,

            decision:
                decision.decision ??
                null,

            reason:
                execution.last_action ??
                decision.reason ??
                orchestrator.last_action ??
                null,
        };
    };

    const getSymbolPositions = (symbol: string) =>
        (tradingState.positions ?? []).filter(
            (position: any) =>
                String(position?.symbol ?? '').toUpperCase() ===
                symbol.toUpperCase()
        );

    const getPositionSummary = (symbol: string) => {
        const positions = getSymbolPositions(symbol);

        const volume = positions.reduce(
            (total: number, position: any) =>
                total + Number(position?.volume ?? 0),
            0
        );

        const floatingPl = positions.reduce(
            (total: number, position: any) =>
                total + Number(
                    position?.floating_pl ??
                    position?.floatingPl ??
                    0
                ),
            0
        );

        const sides = Array.from(
            new Set(
                positions
                    .map((position: any) =>
                        String(
                            position?.side ??
                            position?.direction ??
                            ''
                        ).toUpperCase()
                    )
                    .filter(Boolean)
            )
        );

        return {
            position: volume,
            pnl: floatingPl,
        };
    };

    const xauPosition = getPositionSummary('XAUUSDm');
    const btcPosition = getPositionSummary('BTCUSDm');

    const xau = {
        ...buildInstrumentState('XAUUSDm'),
        position: xauPosition.position,
        pnl: xauPosition.pnl,
        risk: tradingState.riskPerTrade,
    };

    const btc = {
        ...buildInstrumentState('BTCUSDm'),
        position: btcPosition.position,
        pnl: btcPosition.pnl,
        risk: tradingState.riskPerTrade,
    };

    const financialIntelligence =
        tradingState.financialIntelligence ?? {};

    const marketAnalyst =
        financialIntelligence.specialist_results?.market_analyst ?? {};

    const marketConditions =
        marketAnalyst.market_conditions ?? {};

    const regime =
        marketConditions.market_regime?.regime ??
        marketConditions.regime ??
        null;

    const trend =
        marketConditions.trend?.trend ??
        null;

    const trendConfidence =
        marketConditions.trend?.confidence ??
        null;

    const assessment =
        trend
            ? `${trend}${trendConfidence !== null ? ` (${Number(trendConfidence).toFixed(1)}%)` : ''}`
            : null;

    const decision =
        marketAnalyst.execution_authorized === true
            ? 'AUTHORIZED'
            : 'ASSISTANCE ONLY';

    const vfia = {
        status:
            financialIntelligence.observation_count > 0
                ? 'ONLINE'
                : 'AWAITING DATA',

        regime,

        assessment,

        decision,

        confidence:
            trendConfidence,

        reason:
            marketAnalyst.observation_count !== undefined
                ? `${marketAnalyst.observation_count} observations • ${displayValue(
                    financialIntelligence.registered_agents?.join(', '),
                    'No specialist'
                )} • Execution authorization remains disabled.`
                : null,
    };

    const vfiaStatusClass =
        vfia.status === 'ONLINE'
            ? 'telemetry-positive'
            : 'telemetry-warning';

    const decisionClass =
        vfia.decision === 'AUTHORIZED'
            ? 'telemetry-positive'
            : 'telemetry-warning';

    return (
        <section className="telemetry-shell space-y-5">

            {/* CORE HEADER */}
            <div className="telemetry-card p-5 md:p-6">

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                        <div className="flex items-center gap-3">

                            <BrainCircuit className="h-6 w-6 text-emerald-400" />

                            <h2 className="text-xl font-black tracking-[0.14em] text-white md:text-2xl">
                                NEURAL EXECUTION CORE
                            </h2>

                        </div>

                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                            AI-ASSISTED AUTOMATED TRADING STATE
                        </p>
                    </div>

                    <div className="telemetry-status telemetry-status-online self-start md:self-auto">
                        <span className="mr-2">●</span>
                        SHARED TRADING STATE
                    </div>

                </div>

            </div>

            {/* INSTRUMENT STATES */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">

                <InstrumentCard
                    symbol="XAUUSDm"
                    data={xau}
                />

                <InstrumentCard
                    symbol="BTCUSDm"
                    data={btc}
                />

            </div>

            {/* VFI */}
            <div className="telemetry-card p-5 md:p-6">

                <div className="mb-5 flex flex-col gap-4 border-b border-zinc-900 pb-4 md:flex-row md:items-center md:justify-between">

                    <div className="flex items-center gap-3">

                        <BrainCircuit className="h-6 w-6 text-emerald-400" />

                        <div>
                            <div className="text-base font-black tracking-[0.14em] text-white md:text-lg">
                                VOLSIM FINANCIAL INTELLIGENCE
                            </div>

                            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                                DECISION ASSISTANCE LAYER
                            </div>
                        </div>

                    </div>

                    <Zap className="h-5 w-5 text-emerald-400" />

                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">

                    <MetricRow
                        label="STATUS"
                        value={displayValue(
                            vfia.status,
                            'AWAITING DATA'
                        )}
                        valueClass={vfiaStatusClass}
                        primary
                    />

                    <MetricRow
                        label="REGIME"
                        value={displayValue(
                            vfia.regime
                        )}
                        primary
                    />

                    <MetricRow
                        label="ASSESSMENT"
                        value={displayValue(
                            vfia.assessment
                        )}
                        primary
                    />

                    <MetricRow
                        label="DECISION"
                        value={displayValue(
                            vfia.decision
                        )}
                        valueClass={decisionClass}
                        primary
                    />

                    <MetricRow
                        label="CONFIDENCE"
                        value={percentValue(
                            vfia.confidence
                        )}
                        primary
                    />

                </div>

                <div className="mt-5 border-t border-zinc-900 pt-4">

                    <div className="flex items-start gap-3">

                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                        <div className="min-w-0">

                            <div className="telemetry-label mb-2">
                                INTELLIGENCE ASSISTANCE
                            </div>

                            <div className="rounded border border-zinc-900 bg-black/20 px-3 py-3 text-xs font-bold leading-relaxed tracking-wide text-zinc-300">
                                {displayValue(
                                    vfia.reason,
                                    'Live VolSim Financial Intelligence decision context will appear here when supplied by the shared backend trading state.'
                                )}
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
}
