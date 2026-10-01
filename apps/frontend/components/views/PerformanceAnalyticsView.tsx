'use client';

import React, { useState, useEffect } from 'react';
import { TradingApiClient } from '../../lib/TradingApiClient';
import { useAuth } from '../../src/auth/AuthProvider';
import {
  TrendingUp,
  Activity,
  ShieldCheck,
  Percent,
  Layers,
  BarChart3,
  Loader2,
  AlertCircle,
  Target,
  Gauge,
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  colorClass: string;
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
  colorClass,
}: MetricCardProps) {
  return (
    <div className="telemetry-card p-4 md:p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="telemetry-label">{label}</div>
        <div className={colorClass}>{icon}</div>
      </div>

      <div className="telemetry-value-xl mt-3 text-white">
        {value}
      </div>

      <p className="mt-2 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
        {subtext}
      </p>
    </div>
  );
}

interface AnalyticsPayload {
  sharpeRatio: number;
  profitFactor: number;
  sortinoRatio: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  maxDrawdown: number;
  expectancy: number;
  maxConsecutiveWins: number;
  assetMetrics: Array<{
    symbol: string;
    volume: number;
    profit: number;
    loss: number;
    net: number;
  }>;
}

export default function PerformanceAnalyticsView() {
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();

  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'ALL'>('30D');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) {
      return;
    }

    const authenticatedAccessToken = accessToken;

    async function fetchLiveAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const result = await TradingApiClient.getAuthenticated(
          `/api/analytics/performance?timeframe=${timeframe}`,
          authenticatedAccessToken,
        );

        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve metrics from MT5 kernel.');
      } finally {
        setLoading(false);
      }
    }

    fetchLiveAnalytics();
  }, [timeframe, accessToken, isAuthenticated, authLoading]);

  if (authLoading || !isAuthenticated || !accessToken) {
    return (
      <div className="telemetry-shell min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="telemetry-label">
          AUTHENTICATING ANALYTICS SESSION...
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="telemetry-shell min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span className="telemetry-label">
          AGGREGATING LIVE MT5 BRIDGE TRADE HISTORY RUNS...
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="telemetry-shell min-h-[400px] flex flex-col items-center justify-center">
        <div className="telemetry-card border-rose-900/40 bg-rose-950/10 p-8 text-center max-w-xl">
          <AlertCircle className="w-7 h-7 text-rose-500 mx-auto mb-4" />

          <div className="telemetry-label text-rose-400">
            FASTAPI PIPELINE DISCONNECTED
          </div>

          <p className="text-zinc-500 max-w-sm text-[11px] mt-3 mx-auto font-mono">
            {error || 'Verify the FastAPI execution context on port 10000.'}
          </p>
        </div>
      </div>
    );
  }

  const sharpe = data.sharpeRatio ?? 0.0;
  const pFactor = data.profitFactor ?? 1.0;
  const sortino = data.sortinoRatio ?? 0.0;
  const wRate = data.winRate ?? 0.0;
  const maxDD = data.maxDrawdown ?? 0.0;
  const averageWin = data.avgWin ?? 0.0;
  const averageLoss = data.avgLoss ?? 0.0;
  const expRatio = data.expectancy ?? 0.0;
  const assetRows = data.assetMetrics ?? [];

  const drawdownPercent = Math.min(
    100,
    Math.max(0, (Math.abs(maxDD) / 7.5) * 100),
  );

  return (
    <div className="telemetry-shell space-y-5">

      {/* COMMAND HEADER */}
      <div className="telemetry-card overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />

                <span className="telemetry-label">
                  LIVE PERFORMANCE INTELLIGENCE
                </span>

                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                PERFORMANCE ANALYTICS
              </h2>

              <p className="mt-1 text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.16em]">
                Authenticated MT5 execution ledger analysis
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">

              <div className="telemetry-card px-4 py-3">
                <div className="telemetry-label mb-2">
                  ANALYSIS WINDOW
                </div>

                <div className="flex bg-zinc-950 border border-zinc-800 rounded-sm p-0.5">
                  {(['30D', '90D', 'ALL'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`px-3 py-1.5 text-[10px] font-black tracking-wider rounded-sm uppercase transition-colors ${
                        timeframe === t
                          ? 'bg-zinc-800 text-emerald-400'
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="telemetry-card px-4 py-3 min-w-[135px]">
                <div className="telemetry-label">
                  DATA SOURCE
                </div>

                <div className="mt-1 text-sm font-black uppercase tracking-wider text-emerald-400">
                  MT5 LEDGER
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="telemetry-divider" />

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800/70">
          <div className="px-4 py-4">
            <div className="telemetry-label">TRADES</div>
            <div className="telemetry-value-lg text-white mt-1">
              {data.totalTrades ?? 0}
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="telemetry-label">WIN RATE</div>
            <div className="telemetry-value-lg text-emerald-400 mt-1">
              {wRate.toFixed(1)}%
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="telemetry-label">EXPECTANCY</div>
            <div className={`telemetry-value-lg mt-1 ${
              expRatio >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {expRatio >= 0 ? '+' : ''}${expRatio.toFixed(2)}
            </div>
          </div>

          <div className="px-4 py-4">
            <div className="telemetry-label">MAX DRAWDOWN</div>
            <div className="telemetry-value-lg text-rose-400 mt-1">
              -{Math.abs(maxDD).toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* PRIMARY STATISTICS */}
      <section>
        <div className="telemetry-section mb-3">
          RISK-ADJUSTED PERFORMANCE MATRIX
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Sharpe Ratio"
            value={sharpe.toFixed(2)}
            subtext="Annualized risk-adjusted return"
            icon={<Activity className="w-5 h-5" />}
            colorClass="text-emerald-400"
          />

          <MetricCard
            label="Profit Factor"
            value={pFactor.toFixed(2)}
            subtext="Gross profit / gross loss"
            icon={<TrendingUp className="w-5 h-5" />}
            colorClass="text-emerald-400"
          />

          <MetricCard
            label="Sortino Ratio"
            value={sortino.toFixed(2)}
            subtext="Downside-risk adjusted return"
            icon={<ShieldCheck className="w-5 h-5" />}
            colorClass="text-cyan-400"
          />

          <MetricCard
            label="Win Rate"
            value={`${wRate.toFixed(1)}%`}
            subtext={`${data.winningTrades ?? 0} W / ${data.losingTrades ?? 0} L`}
            icon={<Percent className="w-5 h-5" />}
            colorClass="text-emerald-400"
          />
        </div>
      </section>

      {/* RISK + TRADE PROFILE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <div className="xl:col-span-2 telemetry-card p-5 md:p-6">
          <div className="telemetry-card-header">
            <div>
              <div className="telemetry-section">
                RISK PROFILE
              </div>

              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">
                Peak-to-trough drawdown boundary
              </div>
            </div>

            <Gauge className="w-5 h-5 text-rose-400" />
          </div>

          <div className="mt-7">
            <div className="flex items-end justify-between gap-4 mb-3">
              <div>
                <div className="telemetry-label">
                  MAX SYSTEM DRAWDOWN
                </div>

                <div className="telemetry-value-xl text-rose-400 mt-1">
                  -{Math.abs(maxDD).toFixed(2)}%
                </div>
              </div>

              <div className="text-right text-[9px] text-zinc-600 uppercase tracking-widest">
                Reference boundary
                <div className="text-zinc-400 font-bold mt-1">
                  7.50%
                </div>
              </div>
            </div>

            <div className="h-3 bg-zinc-950 border border-zinc-800 rounded-sm overflow-hidden">
              <div
                className="h-full bg-rose-500/80 transition-all duration-500"
                style={{ width: `${drawdownPercent}%` }}
              />
            </div>

            <div className="flex justify-between mt-2 text-[9px] uppercase tracking-widest">
              <span className="text-zinc-600">0%</span>
              <span className="text-zinc-600">7.50% reference</span>
            </div>
          </div>
        </div>

        <div className="telemetry-card p-5 md:p-6">
          <div className="telemetry-card-header">
            <div>
              <div className="telemetry-section">
                TRADE STATISTICS
              </div>

              <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">
                Ledger distribution
              </div>
            </div>

            <Target className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="mt-3 divide-y divide-zinc-900/70">

            <div className="telemetry-metric-row">
              <span className="text-zinc-500">Total executions</span>
              <span className="text-white font-black">
                {data.totalTrades ?? 0}
              </span>
            </div>

            <div className="telemetry-metric-row">
              <span className="text-zinc-500">Average win</span>
              <span className="text-emerald-400 font-black">
                +${averageWin.toFixed(2)}
              </span>
            </div>

            <div className="telemetry-metric-row">
              <span className="text-zinc-500">Average loss</span>
              <span className="text-rose-400 font-black">
                -${Math.abs(averageLoss).toFixed(2)}
              </span>
            </div>

            <div className="telemetry-metric-row">
              <span className="text-zinc-500">Expectancy / trade</span>
              <span className={`font-black ${
                expRatio >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {expRatio >= 0 ? '+' : ''}${expRatio.toFixed(2)}
              </span>
            </div>

            <div className="telemetry-metric-row">
              <span className="text-zinc-500">Max consecutive wins</span>
              <span className="text-white font-black">
                {data.maxConsecutiveWins ?? 0}
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* ASSET MATRIX */}
      <section>
        <div className="telemetry-section mb-3">
          ASSET PERFORMANCE MATRIX
        </div>

        <div className="telemetry-card overflow-hidden">
          <div className="grid grid-cols-5 p-4 bg-zinc-950/80 border-b border-zinc-800 text-[9px] md:text-[10px] uppercase tracking-widest font-black text-zinc-600">
            <div>Asset</div>
            <div className="text-right">Volume</div>
            <div className="text-right">Gross Profit</div>
            <div className="text-right">Gross Loss</div>
            <div className="text-right">Net P/L</div>
          </div>

          <div className="divide-y divide-zinc-900/60 font-mono">
            {assetRows.length > 0 ? (
              assetRows.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 px-4 py-4 items-center hover:bg-zinc-900/20 transition-colors"
                >
                  <div className="text-white font-black text-xs md:text-sm">
                    {row.symbol}
                  </div>

                  <div className="text-right text-zinc-400 text-[11px]">
                    {row.volume.toFixed(2)}
                    <span className="text-zinc-600 ml-1">LOTS</span>
                  </div>

                  <div className="text-right text-emerald-400 text-[11px] font-bold">
                    +${row.profit.toFixed(2)}
                  </div>

                  <div className="text-right text-rose-400 text-[11px] font-bold">
                    -${Math.abs(row.loss).toFixed(2)}
                  </div>

                  <div className={`text-right text-xs md:text-sm font-black ${
                    row.net >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}>
                    {row.net >= 0 ? '+' : ''}${row.net.toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-10 text-center">
                <div className="telemetry-label">
                  NO ASSET PERFORMANCE DATA
                </div>
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-950/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
              Authenticated analytics source
            </span>

            <span className="text-[9px] text-emerald-400 uppercase tracking-widest font-bold">
              MT5 LEDGER • {timeframe}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
