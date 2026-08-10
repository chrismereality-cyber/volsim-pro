'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

export default function PortfolioOverviewView() {
  const state = useTradingStore();

  return (
    <div className="space-y-6 font-mono text-zinc-300">

      <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight uppercase">
            // PORTFOLIO COMMAND CENTER
          </h1>

          <p className="text-xs text-zinc-500 mt-1">
            Real-time live broker execution environment matrix.
          </p>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 px-4 py-2 text-right">
          <div className="text-[10px] uppercase text-zinc-500">
            Exposure
          </div>

          <div className="text-lg font-bold text-white">
            $0.00
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <Metric
          title="WIN RATE"
          value={`${state.winRate.toFixed(1)}%`}
        />

        <Metric
          title="PROFIT FACTOR"
          value={state.profitFactor.toFixed(2)}
        />

        <Metric
          title="EXPECTANCY"
          value={`$${state.expectancy.toFixed(2)}`}
        />

        <Metric
          title="SHARPE RATIO"
          value={state.sharpeRatio.toFixed(2)}
        />

        <Metric
          title="NET PROFIT"
          value={`$${state.totalNetProfit.toFixed(2)}`}
        />

        <Metric
          title="MAX DRAWDOWN"
          value={`${state.maxDrawdown.toFixed(2)}%`}
        />

        <Metric
          title="CURRENT DD"
          value={`${state.currentDrawdown.toFixed(2)}%`}
        />

        <Metric
          title="RISK / REWARD"
          value={`1 : ${state.riskRewardRatio.toFixed(2)}`}
        />

      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        <Panel title="FINANCIAL BALANCES">

          <Row
            label="Balance"
            value={`$${state.balance.toFixed(2)}`}
          />

          <Row
            label="Equity"
            value={`$${state.equity.toFixed(2)}`}
          />

          <Row
            label="Floating P/L"
            value={`$${state.floatingPl.toFixed(2)}`}
          />

        </Panel>

        <Panel title="PERIODIC PERFORMANCE">

          <Row
            label="Daily"
            value={`$${state.dailyPl.toFixed(2)}`}
          />

          <Row
            label="Weekly"
            value={`$${state.weeklyPl.toFixed(2)}`}
          />

          <Row
            label="Monthly"
            value={`$${state.monthlyPl.toFixed(2)}`}
          />

        </Panel>

        <Panel title="EXECUTION">

          <Row
            label="Trades"
            value={String(state.totalTrades)}
          />

          <Row
            label="Avg Duration"
            value={`${state.avgDurationMinutes} mins`}
          />

          <Row
            label="FastAPI"
            value={state.isFastApiConnected ? 'ONLINE' : 'OFFLINE'}
          />

        </Panel>

      </div>

    </div>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded border border-zinc-900 bg-zinc-950 p-4">
      <div className="text-[10px] uppercase text-zinc-500">
        {title}
      </div>

      <div className="mt-2 text-xl font-bold text-white">
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-zinc-900 bg-zinc-950 p-4">
      <h2 className="mb-4 border-b border-zinc-900 pb-2 text-xs font-bold uppercase text-zinc-400">
        {title}
      </h2>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">
        {label}
      </span>

      <span className="font-semibold text-white">
        {value}
      </span>
    </div>
  );
}
