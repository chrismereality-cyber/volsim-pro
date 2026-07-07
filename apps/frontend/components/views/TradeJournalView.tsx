import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    fetch('http://127.0.0.1:8080/api/analytics/performance')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'success' && data.assetMetrics) {
          setMetrics(data.assetMetrics);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed fetching ledger data:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 p-6 font-mono text-zinc-100">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight text-white">// TRANSACTION CLEARINGHOUSE JOURNAL ACTIVE</h1>
        <p className="text-xs text-zinc-400 mt-1">Immutable audit trail of cleared asset settlements and volume allocation vectors.</p>
      </div>

      {loading ? (
        <div className="text-xs text-emerald-500 animate-pulse">// RETRIEVING ARCHIVAL RECORD LEDGER...</div>
      ) : metrics.length === 0 ? (
        <div className="border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
          NO HISTORICAL HISTOGRAMS FOUND ON THE ACTIVE BACKEND INSTANCE.
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-900/50 text-zinc-300 border-b border-zinc-800 text-[10px] tracking-wider uppercase">
              <tr>
                <th className="p-3 font-semibold">// ASSET MATRIX</th>
                <th className="p-3 font-semibold">CUMULATIVE VOLUME</th>
                <th className="p-3 font-semibold">TOTAL TRADES</th>
                <th className="p-3 font-semibold">WIN RATE BASELINE</th>
                <th className="p-3 font-semibold">NET REALIZED P/L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {metrics.map((asset, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-3 font-bold text-white tracking-wide">{asset.symbol}</td>
                  <td className="p-3">{asset.volume.toFixed(2)} Lots</td>
                  <td className="p-3">{asset.trades} Executions</td>
                  <td className="p-3 text-emerald-400 font-semibold">{asset.winRate.toFixed(1)}%</td>
                  <td className={`p-3 font-semibold ${asset.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {asset.profit >= 0 ? `+$${asset.profit.toFixed(2)}` : `-$${Math.abs(asset.profit).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}