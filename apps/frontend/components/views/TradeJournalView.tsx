import { TradingApiClient } from "../../lib/TradingApiClient";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../src/auth/AuthProvider';

interface AssetMetric {
  symbol: string;
  volume: number;
  profit: number;
  winRate: number;
  trades: number;
}

export default function TradeJournalView() {
  const [metrics, setMetrics] = useState<AssetMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    accessToken,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated ||
      !accessToken
    ) {
      return;
    }

    let cancelled = false;

    setLoading(true);

    TradingApiClient.getAuthenticated(
      '/api/analytics/performance',
      accessToken,
    )
      .then((response: any) => {
        if (cancelled) return;

        const assetMetrics = response?.data?.assetMetrics;

        if (
          response?.status === 'success' &&
          Array.isArray(assetMetrics)
        ) {
          setMetrics(assetMetrics);
        } else {
          setMetrics([]);
        }
      })
      .catch((err: any) => {
        if (cancelled) return;

        console.error("Failed fetching ledger data:", err);
        setMetrics([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    isAuthenticated,
    authLoading,
  ]);

  const totalTrades = metrics.reduce(
    (sum, asset) => sum + asset.trades,
    0,
  );

  const totalVolume = metrics.reduce(
    (sum, asset) => sum + asset.volume,
    0,
  );

  const totalProfit = metrics.reduce(
    (sum, asset) => sum + asset.profit,
    0,
  );

  const avgWinRate =
    metrics.length > 0
      ? metrics.reduce((sum, asset) => sum + asset.winRate, 0) /
        metrics.length
      : 0;

  const formatProfit = (value: number) => {
    if (value >= 0) {
      return `+$${value.toFixed(2)}`;
    }

    return `-$${Math.abs(value).toFixed(2)}`;
  };

  return (
    <div className="telemetry-shell space-y-6">
      <header className="border-b border-zinc-800 pb-5">
        <div className="telemetry-sublabel">
          AUDIT / EXECUTION HISTORY
        </div>

        <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
          Trade Journal
        </h1>

        <p className="mt-2 text-sm font-medium text-zinc-400">
          Authenticated execution ledger and realized asset-level settlement record.
        </p>
      </header>

      {loading ? (
        <div className="telemetry-card p-8">
          <div className="telemetry-status telemetry-status-online">
            RETRIEVING EXECUTION LEDGER
          </div>

          <div className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-500 animate-pulse">
            Awaiting authenticated ledger response...
          </div>
        </div>
      ) : (
        <>
          <section>
            <div className="telemetry-section">
              JOURNAL TELEMETRY
            </div>

            <div className="telemetry-grid mt-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              <div className="telemetry-card">
                <div className="telemetry-label">
                  ASSET RECORDS
                </div>

                <div className="telemetry-value-lg mt-2">
                  {metrics.length}
                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  Instrument settlement groups
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-label">
                  TOTAL EXECUTIONS
                </div>

                <div className="telemetry-value-lg mt-2">
                  {totalTrades}
                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  Recorded trade count
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-label">
                  TOTAL VOLUME
                </div>

                <div className="telemetry-value-lg mt-2">
                  {totalVolume.toFixed(2)}
                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  Aggregate lots
                </div>
              </div>

              <div className="telemetry-card">
                <div className="telemetry-label">
                  NET REALIZED P/L
                </div>

                <div
                  className={`telemetry-value-lg mt-2 ${
                    totalProfit >= 0
                      ? 'telemetry-positive'
                      : 'telemetry-negative'
                  }`}
                >
                  {formatProfit(totalProfit)}
                </div>

                <div className="mt-2 text-xs text-zinc-500">
                  Authenticated performance ledger
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="telemetry-section">
              EXECUTION HISTORY MATRIX
            </div>

            {metrics.length === 0 ? (
              <div className="telemetry-card mt-3 p-10 text-center">
                <div className="telemetry-label">
                  NO EXECUTION RECORDS
                </div>

                <div className="mt-3 text-sm font-semibold text-zinc-400">
                  No historical asset settlement records are available on the active backend instance.
                </div>

                <div className="mt-2 text-xs text-zinc-600">
                  The journal is displaying the authenticated ledger response without generating synthetic trades.
                </div>
              </div>
            ) : (
              <div className="telemetry-card mt-3 overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/80">
                        <th className="telemetry-label px-4 py-4">
                          ASSET
                        </th>
                        <th className="telemetry-label px-4 py-4">
                          VOLUME
                        </th>
                        <th className="telemetry-label px-4 py-4">
                          EXECUTIONS
                        </th>
                        <th className="telemetry-label px-4 py-4">
                          WIN RATE
                        </th>
                        <th className="telemetry-label px-4 py-4">
                          REALIZED P/L
                        </th>
                        <th className="telemetry-label px-4 py-4">
                          LEDGER STATE
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-zinc-900">
                      {metrics.map((asset, idx) => {
                        const profitable = asset.profit >= 0;

                        return (
                          <tr
                            key={`${asset.symbol}-${idx}`}
                            className="transition-colors hover:bg-zinc-900/40"
                          >
                            <td className="px-4 py-4">
                              <div className="text-base font-black tracking-wide text-white">
                                {asset.symbol}
                              </div>

                              <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                                Asset settlement record
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="text-sm font-bold text-zinc-200">
                                {asset.volume.toFixed(2)}
                              </div>

                              <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                                Lots
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="text-sm font-bold text-zinc-200">
                                {asset.trades}
                              </div>

                              <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                                Executions
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="text-sm font-black text-zinc-100">
                                {asset.winRate.toFixed(1)}%
                              </div>

                              <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-zinc-900">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, asset.winRate),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div
                                className={`text-base font-black ${
                                  profitable
                                    ? 'telemetry-positive'
                                    : 'telemetry-negative'
                                }`}
                              >
                                {formatProfit(asset.profit)}
                              </div>

                              <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                                Realized
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`telemetry-status ${
                                  profitable
                                    ? 'telemetry-status-online'
                                    : 'telemetry-status-neutral'
                                }`}
                              >
                                {profitable
                                  ? 'RECORDED'
                                  : 'RECORDED / LOSS'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="telemetry-section">
              AUDIT CONTEXT
            </div>

            <div className="telemetry-card mt-3">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <div className="telemetry-label">
                    DATA SOURCE
                  </div>
                  <div className="telemetry-value-md mt-2">
                    MT5 LEDGER
                  </div>
                </div>

                <div>
                  <div className="telemetry-label">
                    RECORD TYPE
                  </div>
                  <div className="telemetry-value-md mt-2">
                    ASSET AGGREGATE
                  </div>
                </div>

                <div>
                  <div className="telemetry-label">
                    AVERAGE WIN RATE
                  </div>
                  <div className="telemetry-value-md mt-2">
                    {avgWinRate.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="telemetry-divider my-5" />

              <p className="text-xs leading-5 text-zinc-500">
                This journal currently renders the authenticated performance
                ledger exposed by the backend. Individual trade IDs,
                timestamps, entry/exit prices, AI decisions, broker fills,
                and execution traces are intentionally not fabricated until
                the underlying trade-ledger endpoint exposes those records.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
