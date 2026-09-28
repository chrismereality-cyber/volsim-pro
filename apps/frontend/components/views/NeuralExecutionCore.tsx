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
            ? 'text-emerald-400'
            : signal === 'SELL'
                ? 'text-rose-400'
                : 'text-zinc-400';

    return (
        <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                    <div className="text-sm font-black tracking-widest text-white">
                        {symbol}
                    </div>

                    <div className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">
                        Neural instrument state
                    </div>
                </div>

                <Activity className="h-4 w-4 text-zinc-600" />
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                <MetricRow
                    label="Signal"
                    value={signal}
                    valueClass={signalClass}
                />

                <MetricRow
                    label="Confidence"
                    value={percentValue(data.confidence)}
                />

                <MetricRow
                    label="Position"
                    value={displayValue(data.position)}
                />

                <MetricRow
                    label="Risk"
                    value={percentValue(data.risk)}
                />

                <MetricRow
                    label="P&L"
                    value={moneyValue(data.pnl)}
                />

                <MetricRow
                    label="Status"
                    value={displayValue(data.status, 'STANDBY')}
                />
            </div>

            {data.reason && (
                <div className="mt-4 border-t border-zinc-900 pt-3">
                    <div className="mb-1 text-[9px] uppercase tracking-widest text-zinc-600">
                        Intelligence context
                    </div>

                    <div className="text-[10px] leading-relaxed text-zinc-400">
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
}: {
    label: string;
    value: string;
    valueClass?: string;
}) {
    return (
        <div>
            <div className="text-[9px] uppercase tracking-widest text-zinc-600">
                {label}
            </div>

            <div className={`mt-1 font-semibold ${valueClass}`}>
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

    return (
        <section className="space-y-4">

            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-emerald-400" />

                        <h2 className="text-sm font-black tracking-widest text-white">
                            NEURAL EXECUTION CORE
                        </h2>
                    </div>

                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                        AI-assisted automated trading state
                    </p>
                </div>

                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-zinc-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Shared Trading State
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <InstrumentCard
                    symbol="XAUUSDm"
                    data={xau}
                />

                <InstrumentCard
                    symbol="BTCUSDm"
                    data={btc}
                />
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950/80 p-4">

                <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-emerald-400" />

                        <div>
                            <div className="text-xs font-black tracking-widest text-white">
                                VOLSIM FINANCIAL INTELLIGENCE
                            </div>

                            <div className="mt-1 text-[9px] uppercase tracking-widest text-zinc-600">
                                Decision assistance layer
                            </div>
                        </div>
                    </div>

                    <Zap className="h-4 w-4 text-zinc-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">

                    <MetricRow
                        label="Status"
                        value={displayValue(
                            vfia.status,
                            'AWAITING DATA'
                        )}
                    />

                    <MetricRow
                        label="Regime"
                        value={displayValue(
                            vfia.regime
                        )}
                    />

                    <MetricRow
                        label="Assessment"
                        value={displayValue(
                            vfia.assessment
                        )}
                    />

                    <MetricRow
                        label="Decision"
                        value={displayValue(
                            vfia.decision
                        )}
                    />

                    <MetricRow
                        label="Confidence"
                        value={percentValue(
                            vfia.confidence
                        )}
                    />

                </div>

                <div className="mt-4 flex items-start gap-3 border-t border-zinc-900 pt-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />

                    <div>
                        <div className="text-[9px] uppercase tracking-widest text-zinc-600">
                            Intelligence assistance
                        </div>

                        <div className="mt-1 text-[10px] leading-relaxed text-zinc-400">
                            {displayValue(
                                vfia.reason,
                                'Live VolSim Financial Intelligence decision context will appear here when supplied by the shared backend trading state.'
                            )}
                        </div>
                    </div>
                </div>

            </div>

        </section>
    );
}





