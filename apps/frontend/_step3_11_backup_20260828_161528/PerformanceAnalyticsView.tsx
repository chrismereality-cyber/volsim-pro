'use client';



import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  ShieldCheck,
  Percent,
  Layers,
  BarChart3,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  colorClass: string;
}

function MetricCard({ label, value, subtext, icon, colorClass }: MetricCardProps) {
  return (
    <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-4 space-y-2 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">{label}</span>
        <div className={colorClass}>{icon}</div>
      </div>
      <div className="text-xl font-bold text-zinc-100 tracking-tight">{value}</div>
      <p className="text-[10px] text-zinc-400 font-mono tracking-wide">{subtext}</p>
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
  const [timeframe, setTimeframe] = useState<'30D' | '90D' | 'ALL'>('30D');
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiveAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
  `http://127.0.0.1:10000/api/analytics/performance?timeframe=${timeframe}`
);

if (!response.ok) {
  throw new Error(`HTTP ${response.status}`);
}

const result = await response.json();
setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve metrics from MT5 kernel.');
      } finally {
        setLoading(false);
      }
    }
    fetchLiveAnalytics();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-3 font-mono text-xs text-zinc-400">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        <span>AGGREGATING LIVE MT5 BRIDGE TRADE HISTORY RUNS...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[400px] border border-red-900/30 bg-red-950/10 rounded-sm flex flex-col items-center justify-center gap-2 font-mono text-xs text-red-400 p-6 text-center">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <span className="font-bold uppercase tracking-wider">FastAPI Pipeline Disconnected</span>
        <p className="text-zinc-500 max-w-sm text-[11px] mt-1">{error || 'Verify port 8080 execution context status.'}</p>
      </div>
    );
  }

  // Fallback structural safety values to explicitly guard against undefined properties
  const sharpe = data.sharpeRatio ?? 0.0;
  const pFactor = data.profitFactor ?? 1.0;
  const sortino = data.sortinoRatio ?? 0.0;
  const wRate = data.winRate ?? 0.0;
  const maxDD = data.maxDrawdown ?? 0.0;
  const averageWin = data.avgWin ?? 0.0;
  const averageLoss = data.avgLoss ?? 0.0;
  const expRatio = data.expectancy ?? 0.0;
  const assetRows = data.assetMetrics ?? [];

  return (
    <div className="space-y-6 font-mono text-xs">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm tracking-wider gap-3">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>// PERFORMANCE ANALYTICS WORKSPACE TERMINAL (LIVE DATA)</span>
          </div>
          <p className="text-zinc-500">Live transaction ledger audit derived via local MT5 execution database pipelines.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-900 p-0.5 border border-zinc-800 rounded-sm">
            {(['30D', '90D', 'ALL'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 text-[10px] font-bold tracking-wider rounded-sm uppercase transition-colors ${
                  timeframe === t ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Sharpe Ratio (Ann.)" value={sharpe.toFixed(2)} subtext="Risk-adjusted metric premium" icon={<Activity className="w-4 h-4" />} colorClass="text-emerald-400" />
        <MetricCard label="Profit Factor" value={pFactor.toFixed(2)} subtext="Gross Profits / Gross Losses" icon={<TrendingUp className="w-4 h-4" />} colorClass="text-emerald-400" />
        <MetricCard label="Sortino Ratio" value={sortino.toFixed(2)} subtext="Downside variance threshold" icon={<ShieldCheck className="w-4 h-4" />} colorClass="text-cyan-400" />
        <MetricCard label="Win Rate Matrix" value={`${wRate.toFixed(1)}%`} subtext={`${data.winningTrades ?? 0} W / ${data.losingTrades ?? 0} L distribution`} icon={<Percent className="w-4 h-4" />} colorClass="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 border border-zinc-800 bg-zinc-950/20 rounded-sm p-4 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-200 uppercase tracking-wider text-[11px]">
              <Layers className="w-4 h-4 text-emerald-400" />
              Drawdown & Exposure Management Boundaries
            </div>
          </div>

          <div className="space-y-4 flex-1 justify-center flex flex-col">
            <div>
              <div className="flex justify-between text-[11px] mb-1.5 font-bold">
                <span className="text-zinc-400">Max System Peak-To-Trough Drawdown</span>
                <span className="text-rose-400">-{maxDD.toFixed(2)}%</span>
              </div>
              <div className="w-full bg-zinc-900 h-2 rounded-sm overflow-hidden border border-zinc-800/40">
                <div className="bg-rose-500/80 h-full rounded-sm" style={{ width: `${document ? Math.min(100, (maxDD / 7.50) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2 font-bold text-zinc-200 uppercase tracking-wider text-[11px]">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Descriptive Statistics Array
            </div>
          </div>

          <div className="divide-y divide-zinc-900/60 text-[11px]">
            <div className="flex justify-between py-2"><span className="text-zinc-500">Total Tracked Executions</span><span className="text-zinc-200 font-bold">{data.totalTrades ?? 0}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-500">Average Winning Trade</span><span className="text-emerald-400">+${averageWin.toFixed(2)}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-500">Average Losing Trade</span><span className="text-rose-400">-${Math.abs(averageLoss).toFixed(2)}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-500">Expectancy Ratio Per Trade</span><span className="text-zinc-200 font-bold">+${expRatio.toFixed(2)}</span></div>
            <div className="flex justify-between py-2"><span className="text-zinc-500">Max Consecutive Wins</span><span className="text-zinc-200 font-bold">{data.maxConsecutiveWins ?? 0}</span></div>
          </div>
        </div>

      </div>

      <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm overflow-hidden shadow-2xl">
        <div className="grid grid-cols-5 p-3 text-zinc-500 border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-widest font-bold">
          <div>Core Asset Target</div>
          <div className="text-right">Volume Processed</div>
          <div className="text-right">Gross Profit</div>
          <div className="text-right">Gross Loss</div>
          <div className="text-right">Net System P/L</div>
        </div>

        <div className="divide-y divide-zinc-900/60 font-mono text-[11px]">
          {assetRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-5 px-3 py-3 items-center hover:bg-zinc-900/20 transition-colors">
              <div className="text-zinc-200 font-bold">{row.symbol}</div>
              <div className="text-right text-zinc-400 font-medium">{row.volume.toFixed(2)} Lots</div>
              <div className="text-right text-emerald-500">+${row.profit.toFixed(2)}</div>
              <div className="text-right text-rose-500">-${Math.abs(row.loss).toFixed(2)}</div>
              <div className={`text-right font-bold ${row.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {row.net >= 0 ? '+' : ''}${row.net.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
