'use client';

import React, { useState } from 'react';
import { DollarSign, Percent, Zap, Layers } from 'lucide-react';

export default function CostAnalysisView() {
  return (
    <div className="space-y-6 p-6 font-mono text-zinc-100 bg-black min-h-screen">
      {/* Header Matrix */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">// FRICTION COST AUDITING SUBSYSTEM</h1>
          <p className="text-xs text-zinc-500 mt-1">Real-time Transaction Cost Analysis (TCA), spread variance loops, and execution delays.</p>
        </div>
        <div className="bg-blue-950 border border-blue-800 text-[10px] px-3 py-1.5 font-bold uppercase text-blue-400">
          DRAG INDEX: 1.14 BPS
        </div>
      </div>

      {/* Metric Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-1">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-400" /> Spread Expense
          </div>
          <div className="text-xl font-black text-white">$14.02</div>
          <div className="text-[9px] text-zinc-600">// Base bid-ask crossing cost</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-1">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Percent className="w-3.5 h-3.5 text-blue-400" /> Commissions
          </div>
          <div className="text-xl font-black text-emerald-400">$0.00</div>
          <div className="text-[9px] text-zinc-600">// Raw spreads framework tier</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-1">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Execution Slippage
          </div>
          <div className="text-xl font-black text-amber-500">+0.12 Pips</div>
          <div className="text-[9px] text-zinc-600">// Latency degradation drag</div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-1">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" /> Swap Cost Drag
          </div>
          <div className="text-xl font-black text-zinc-400">-$2.10</div>
          <div className="text-[9px] text-zinc-600">// Overnight premium decay</div>
        </div>
      </div>

      {/* Asset Audit Log Matrix */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          // Asset Friction Vector Ledger
        </h2>

        <div className="overflow-x-auto border border-zinc-800 bg-zinc-950">
          <table className="w-full text-left text-xs text-zinc-400">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              <tr>
                <th className="p-3">Asset Symbol</th>
                <th className="p-3">Avg Spread</th>
                <th className="p-3 text-right">Execution Latency</th>
                <th className="p-3 text-right">Total Drag Burden</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              <tr className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-zinc-200">XAUUSDm</td>
                <td className="p-3 text-zinc-400">1.2 Pips</td>
                <td className="p-3 text-right text-emerald-400 font-bold">14.2 ms</td>
                <td className="p-3 text-right text-blue-400 font-bold">$13.50</td>
              </tr>
              <tr className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-zinc-200">BTCUSDm</td>
                <td className="p-3 text-zinc-400">18.4 Pips</td>
                <td className="p-3 text-right text-amber-500 font-bold">78.6 ms</td>
                <td className="p-3 text-right text-blue-400 font-bold">$18.00</td>
              </tr>
              <tr className="hover:bg-zinc-900/20">
                <td className="p-3 font-bold text-zinc-200">Volatility_100</td>
                <td className="p-3 text-zinc-400">0.50 Pips</td>
                <td className="p-3 text-right text-emerald-400 font-bold">15.0 ms</td>
                <td className="p-3 text-right text-blue-400 font-bold">$0.52</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
