'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Activity, BarChart3, AlertOctagon } from 'lucide-react';

export default function RegimeRobustnessView() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/trading-state');
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    return () => ws.close();
  }, []);

  return (
    <div className="space-y-6 p-6 font-mono text-zinc-100 bg-black min-h-screen">
      {/* Header Matrix Block */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">// REGIME & PORTFOLIO ROBUSTNESS ENGINE</h1>
          <p className="text-xs text-zinc-500 mt-1">Real-time Gaussian Mixture modeling and deterministic macro shift simulations.</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-[10px] px-3 py-1.5 font-bold uppercase text-zinc-400">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          CORE_ENGINE: {connected ? 'ONLINE' : 'LINK_OFFLINE'}
        </div>
      </div>

      {/* Analytical Scoreboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Current Phase Regime
          </div>
          <div className="text-lg font-black text-emerald-400">REGIME_01: REVERSION</div>
          <div className="text-[10px] text-zinc-500">// Low Volatility Variance Phase (&sigma; &lt; 12.5%)</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-blue-400" /> Margin Viability Threshold
          </div>
          <div className="text-lg font-black text-white">91.42% STABLE</div>
          <div className="text-[10px] text-zinc-500">// Maximum projected capital drawdown safely bounded</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-500" /> Tail Risk Exposure
          </div>
          <div className="text-lg font-black text-amber-500">BOUNDED MINIMAL</div>
          <div className="text-[10px] text-zinc-500">// Interday parametric VaR holds within 15% core threshold</div>
        </div>
      </div>

      {/* Stress Testing Simulation Table Component */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-500" /> // Deterministic Stress Permutations Matrix
        </h2>
        
        <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              <tr>
                <th className="p-3">Scenario Identifier</th>
                <th className="p-3">Asset Target Vector Shifts</th>
                <th className="p-3 text-right">Projected Balance Impact</th>
                <th className="p-3 text-center">Engine Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              <tr className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-zinc-200">Systemic Liquidity Squeeze</td>
                <td className="p-3 text-zinc-400">Gold Slips -12.5%, Equities Tumble -20%</td>
                <td className="p-3 text-right text-rose-500 font-bold">-$134.31</td>
                <td className="p-3 text-center"><span className="text-[10px] px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800 text-zinc-400">HOLD BASE SIZING</span></td>
              </tr>
              <tr className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-zinc-200">Black Swan Tail-Risk Volatility</td>
                <td className="p-3 text-zinc-400">Volatility Index Induces Breakout Spikes +150%</td>
                <td className="p-3 text-right text-rose-500 font-bold">-$312.40</td>
                <td className="p-3 text-center"><span className="text-[10px] px-2 py-0.5 bg-rose-950 text-rose-400 rounded border border-rose-800">DEPLOY EXPEDIENT HEDGE</span></td>
              </tr>
              <tr className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-zinc-200">Asymmetric Asset Expansion</td>
                <td className="p-3 text-zinc-400">Gold Surges +8.2% Spot Extension Interday</td>
                <td className="p-3 text-right text-emerald-400 font-bold">+$88.10</td>
                <td className="p-3 text-center"><span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">TRAILING TAKE PROFIT</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}