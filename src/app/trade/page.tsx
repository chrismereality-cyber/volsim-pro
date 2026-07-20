"use client";
import React, { useState, useEffect } from 'react';

interface Position {
  id: string;
  asset: string;
  type: 'BUY' | 'SELL';
  lots: number;
  profit: number;
}

export default function TradePage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [engineMetrics, setEngineMetrics] = useState({ margin: 0.00, leverage: '1:500' });

  useEffect(() => {
    async function fetchLivePositions() {
      try {
        const res = await fetch(\\/status\);
        if (res.ok) {
          const data = await res.json();
          const active = data.active_positions || [];
          
          setPositions(active.map((pos: any) => ({
            id: pos.ticket || pos.id,
            asset: pos.symbol || pos.asset,
            type: String(pos.type).toUpperCase().includes('BUY') ? 'BUY' : 'SELL',
            lots: pos.volume || pos.lots,
            profit: parseFloat(pos.profit || 0)
          })));

          setEngineMetrics({
            margin: data.free_margin ?? data.account_info?.free_margin ?? 0.00,
            leverage: `1:${(data.leverage ?? data.account_info?.leverage) || 500}`
          });
        }
      } catch (err) {
        console.error("Failed syncing trade panel context:", err);
      }
    }
    fetchLivePositions();
    const interval = setInterval(fetchLivePositions, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 bg-slate-950 text-white min-h-screen font-mono">
      <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-wider text-emerald-400">VOLSIM-PRO // TRADING PANEL</h1>
      </div>
      <div className="bg-slate-900 p-4 border border-slate-800 rounded mb-4">
        <div className="text-xs text-slate-400 uppercase">Free Margin: ${engineMetrics.margin.toFixed(2)} | Leverage: {engineMetrics.leverage}</div>
      </div>
      <div className="text-xs text-slate-500 italic">Matrix interface active. Synchronized with local execution layer.</div>
    </div>
  );
}
