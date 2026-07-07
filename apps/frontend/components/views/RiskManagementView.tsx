'use client';

import React, { useEffect, useState } from 'react';

interface HedgingSignal {
  asset: string;
  status: string;
  action: string;
  reason?: string;
  target_delta_offset?: number;
}

interface RiskMetrics {
  portfolio_value: number;
  net_exposure: number;
  allocations: Record<string, number>;
  risk_status: string;
  hedging_signals: HedgingSignal[];
  value_at_risk: number;
}

export default function RiskManagementView() {
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8080/ws/trading-state');

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'metrics_update') {
          setMetrics(data);
        }
      } catch (err) {
        console.error("Error parsing risk metrics packet:", err);
      }
    };

    return () => socket.close();
  }, []);

  if (!metrics) {
    return (
      <div className="p-6 font-mono text-xs text-zinc-500 animate-pulse">
        // AWAITING LINK HANDSHAKE WITH CORE RISK ENGINE ENGINE...
      </div>
    );
  }

  return (
    <div className="p-6 font-mono text-zinc-100 max-w-7xl mx-auto space-y-6">
      {/* Header Pipeline */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-sm font-bold tracking-wider text-zinc-400">// RISK MANAGEMENT ENGINE</h1>
          <p className="text-xs text-zinc-600 mt-1">Real-time parametric VaR and exposure matrix validation</p>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
            <span className="text-zinc-400">{connected ? 'CORE_LIVE' : 'DISCONNECTED'}</span>
          </div>
          <div className={`px-2 py-0.5 border text-[10px] font-bold tracking-widest ${
            metrics.risk_status === 'HEALTHY' ? 'border-emerald-900/50 text-emerald-400 bg-emerald-950/20' : 'border-rose-900/50 text-rose-400 bg-rose-950/20'
          }`}>
            STATUS: {metrics.risk_status}
          </div>
        </div>
      </div>

      {/* Grid Metrics Tier */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-500 text-[10px] tracking-wider uppercase">Portfolio Value</div>
          <div className="text-lg font-bold mt-1">${metrics.portfolio_value.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-500 text-[10px] tracking-wider uppercase">Net Exposure Delta</div>
          <div className={`text-lg font-bold mt-1 ${metrics.net_exposure >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${metrics.net_exposure.toLocaleString(undefined, {minimumFractionDigits: 2})}
          </div>
        </div>
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-500 text-[10px] tracking-wider uppercase">Parametric VaR (1D 95%)</div>
          <div className="text-lg font-bold mt-1 text-amber-500">${(metrics.value_at_risk ?? 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div className="border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-zinc-500 text-[10px] tracking-wider uppercase">Active Allocations</div>
          <div className="text-lg font-bold mt-1 text-zinc-300">{Object.keys(metrics.allocations).length} Clusters</div>
        </div>
      </div>

      {/* Bottom Layout Matrix split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocations Table View */}
        <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 tracking-wide">// ASSET EXPOSURE ALLOCATIONS</h2>
          <div className="space-y-3">
            {Object.entries(metrics.allocations).map(([asset, exposure]) => {
              const allocationPct = Math.min((Math.abs(exposure) / (metrics.portfolio_value || 10000)) * 100, 100);
              return (
                <div key={asset} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-bold">{asset}</span>
                    <span className="text-zinc-500">${exposure.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 border border-zinc-800">
                    <div className="h-full bg-zinc-500 transition-all duration-500" style={{ width: `${allocationPct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hedging Orders Engine Output */}
        <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 tracking-wide">// AUTOMATED HEDGE STRATEGY EXECUTION LOGIC</h2>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {metrics.hedging_signals.map((sig, idx) => (
              <div key={idx} className={`p-3 border text-xs flex justify-between items-center ${
                sig.status === 'BREACHED' ? 'border-rose-900/50 bg-rose-950/10' : 'border-zinc-800 bg-zinc-900/30'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-zinc-300">{sig.asset}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 ${sig.status === 'BREACHED' ? 'bg-rose-950 text-rose-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      {sig.status}
                    </span>
                  </div>
                  {sig.reason && <p className="text-[10px] text-zinc-500 mt-1">{sig.reason}</p>}
                </div>
                <div className="text-right">
                  <span className={`font-mono text-xs font-bold ${sig.action === 'EXECUTE_HEDGE' ? 'text-amber-400' : 'text-zinc-600'}`}>
                    {sig.action}
                  </span>
                  {sig.target_delta_offset && (
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      Offset Target: {sig.target_delta_offset.toFixed(2)} Lots
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}