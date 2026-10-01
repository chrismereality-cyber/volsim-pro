'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';
import NeuralExecutionCore from './NeuralExecutionCore';

export default function PortfolioOverviewView() {
  const state = useTradingStore();

  return (
    <div className="telemetry-shell space-y-6 p-1 font-mono">

      <NeuralExecutionCore />

      {/* COMMAND HEADER */}
      <div className="telemetry-card p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <div className="telemetry-label mb-2">
              PORTFOLIO COMMAND CENTER
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              EXECUTIVE PORTFOLIO OVERVIEW
            </h1>

            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Real-time live broker execution environment matrix
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

            <div className="telemetry-readout min-w-[130px]">
              <div className="telemetry-label">NET EXPOSURE</div>
              <div className="telemetry-value-lg mt-1">
                ${state.netExposure.toFixed(2)}
              </div>
            </div>

            <div className="telemetry-readout min-w-[130px]">
              <div className="telemetry-label">EQUITY</div>
              <div className="telemetry-value-lg mt-1">
                ${state.equity.toFixed(2)}
              </div>
            </div>

            <div className="telemetry-readout col-span-2 sm:col-span-1 min-w-[130px]">
              <div className="telemetry-label">CORE LINK</div>
              <div
                className={
                  state.isFastApiConnected
                    ? 'telemetry-status telemetry-status-online mt-2'
                    : 'telemetry-status telemetry-status-danger mt-2'
                }
              >
                {state.isFastApiConnected ? '● ONLINE' : '● OFFLINE'}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* PERFORMANCE MATRIX */}
      <section>
        <h2 className="telemetry-section">
          PERFORMANCE MATRIX
        </h2>

        <div className="telemetry-grid grid-cols-2 lg:grid-cols-4">

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
            emphasis
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
      </section>

      {/* OPERATIONAL TELEMETRY */}
      <section>
        <h2 className="telemetry-section">
          OPERATIONAL TELEMETRY
        </h2>

        <div className="grid gap-5 lg:grid-cols-3">

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
              accent={state.floatingPl >= 0 ? 'positive' : 'negative'}
            />

          </Panel>

          <Panel title="PERIODIC PERFORMANCE">

            <Row
              label="Daily"
              value={`$${state.dailyPl.toFixed(2)}`}
              accent={state.dailyPl >= 0 ? 'positive' : 'negative'}
            />

            <Row
              label="Weekly"
              value={`$${state.weeklyPl.toFixed(2)}`}
              accent={state.weeklyPl >= 0 ? 'positive' : 'negative'}
            />

            <Row
              label="Monthly"
              value={`$${state.monthlyPl.toFixed(2)}`}
              accent={state.monthlyPl >= 0 ? 'positive' : 'negative'}
            />

          </Panel>

          <Panel title="EXECUTION">

            <Row
              label="Total Trades"
              value={String(state.totalTrades)}
            />

            <Row
              label="Avg Duration"
              value={`${state.avgDurationMinutes} mins`}
            />

            <Row
              label="FastAPI"
              value={state.isFastApiConnected ? 'ONLINE' : 'OFFLINE'}
              accent={state.isFastApiConnected ? 'positive' : 'negative'}
            />

          </Panel>

        </div>
      </section>

    </div>
  );
}

function Metric({
  title,
  value,
  emphasis = false,
}: {
  title: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="telemetry-card min-h-[105px] p-4">
      <div className="telemetry-label">
        {title}
      </div>

      <div
        className={
          emphasis
            ? 'telemetry-value-xl mt-2'
            : 'telemetry-value-lg mt-2'
        }
      >
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
    <div className="telemetry-card p-5">
      <div className="telemetry-card-header">
        {title}
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'positive' | 'negative';
}) {
  const valueClass =
    accent === 'positive'
      ? 'telemetry-positive'
      : accent === 'negative'
        ? 'telemetry-negative'
        : 'text-white';

  return (
    <div className="telemetry-metric-row">
      <span className="telemetry-label">
        {label}
      </span>

      <span className={`text-base font-black tracking-tight ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
