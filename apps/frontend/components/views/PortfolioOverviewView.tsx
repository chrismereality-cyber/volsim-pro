'use client';
import React, { useEffect } from 'react';
import { useTradingStore } from '../../store/useTradingStore';

export default function PortfolioOverviewView() {
  const state = useTradingStore();
  const updateMetrics = useTradingStore((s) => s.updateMetrics);

  useEffect(() => {
    const socketUrl = 'ws://127.0.0.1:8080/ws/trading-state';
    let socket = new WebSocket(socketUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // 🔍 SAFE DIAGNOSTIC LOG - Will show exactly what keys are arriving in your browser console (F12)
        console.log('--- INCOMING WEBSOCKET PAYLOAD ---', data);
        
        if (data && 'balance' in data) {
          updateMetrics(data);
        }
      } catch (err) {
        console.error('Error handling trading state frame:', err);
      }
    };

    return () => socket.close();
  }, [updateMetrics]);

  return (
    <div className="space-y-6 font-mono text-zinc-400">
      {/* Header Matrix */}
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
        <div>
          <h1 className="text-base font-bold text-white tracking-tight uppercase">// PORTFOLIO COMMAND CENTER</h1>
          <p className="text-[11px] text-zinc-500 mt-0.5">Real-time live broker execution environment matrix.</p>
        </div>
        <div className="flex items-center space-x-2 text-[11px] border border-zinc-900 bg-zinc-950 px-2.5 py-1 rounded">
          <span className="text-zinc-500">EXPOSURE:</span>
          <span className={(state.riskExposure ?? 0) > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
            ${(state.riskExposure ?? 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 8-Card Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Win Rate */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">% WIN RATE</span>
          <span className="text-xl font-bold text-emerald-400 tracking-tight block mt-2">
            {(state.winRate ?? 0).toFixed(1)}%
          </span>
        </div>

        {/* 2. Profit Factor */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
            <span>📈 PROFIT FACTOR</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight block mt-2">
            {(state.profitFactor ?? 0).toFixed(2)}
          </span>
        </div>

        {/* 3. Expectancy */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">$ EXPECTANCY</span>
          <span className="text-xl font-bold text-sky-400 tracking-tight block mt-2">
            +${(state.expectancy ?? 0).toFixed(2)}
          </span>
        </div>

        {/* 4. Sharpe Ratio */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
            <span>⭕ SHARPE RATIO</span>
          </div>
          <span className="text-xl font-bold text-amber-500 tracking-tight block mt-2">
            {(state.sharpeRatio ?? 0).toFixed(2)}
          </span>
        </div>

        {/* 5. Net Profit / CAGR */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">NET PROFIT / CAGR</span>
          <div className="text-xl font-bold text-white tracking-tight block mt-2">
            ${(state.totalNetProfit ?? 0).toFixed(2)}{' '}
            <span className="text-xs text-zinc-500 font-normal">/ {(state.cagr ?? 0).toFixed(1)}%</span>
          </div>
        </div>

        {/* 6. Max Drawdown */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
            <span className="text-emerald-500">⚠</span>
            <span className="text-emerald-500">MAX DRAWDOWN</span>
          </div>
          <span className="text-xl font-bold text-emerald-400 tracking-tight block mt-2">
            {(state.maxDrawdown ?? 0).toFixed(2)}%
          </span>
        </div>

        {/* 7. Current Account DD */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">CURRENT ACCOUNT DD</span>
          <span className="text-xl font-bold text-emerald-400 tracking-tight block mt-2">
            {(state.currentDrawdown ?? 0).toFixed(2)}%
          </span>
        </div>

        {/* 8. Risk-Reward Ratio */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded">
          <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">RISK-REWARD RATIO</span>
          <span className="text-xl font-bold text-white tracking-tight block mt-2">
            1 : {(state.riskRewardRatio ?? 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Bottom Performance Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial Balances */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded space-y-2">
          <h3 className="text-xs font-bold text-zinc-300 border-b border-zinc-900 pb-1.5 uppercase flex items-center space-x-2">
            <span>💼</span> <span>Financial Balances</span>
          </h3>
          <div className="flex justify-between text-xs pt-1">
            <span>Total Balance:</span>
            <span className="text-white font-bold">${(state.balance ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Total Equity:</span>
            <span className="text-white font-bold">${(state.equity ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Floating P/L:</span>
            <span className={(state.floatingPl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
              +${(state.floatingPl ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Periodic P/L Performance */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded space-y-2">
          <h3 className="text-xs font-bold text-zinc-300 border-b border-zinc-900 pb-1.5 uppercase flex items-center space-x-2">
            <span>📅</span> <span>Periodic P/L Performance</span>
          </h3>
          <div className="flex justify-between text-xs pt-1">
            <span>Daily P/L:</span>
            <span className={(state.dailyPl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
              +${(state.dailyPl ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Weekly P/L:</span>
            <span className={(state.weeklyPl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
              +${(state.weeklyPl ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Monthly P/L:</span>
            <span className={(state.monthlyPl ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-500'}>
              +${(state.monthlyPl ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Execution & Velocity */}
        <div className="border border-zinc-900 bg-zinc-950 p-4 rounded space-y-2">
          <h3 className="text-xs font-bold text-zinc-300 border-b border-zinc-900 pb-1.5 uppercase flex items-center space-x-2">
            <span>⚡</span> <span>Execution & Velocity</span>
          </h3>
          <div className="flex justify-between text-xs pt-1">
            <span>Total Trades Processed:</span>
            <span className="text-white font-bold">{state.totalTrades ?? 0}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="flex items-center space-x-1">
              <span className="text-zinc-600 text-[10px]">🕒</span>
              <span>Avg Trade Duration:</span>
            </span>
            <span className="text-white font-bold">{state.avgDurationMinutes ?? 0} mins</span>
          </div>
        </div>
      </div>
    </div>
  );
}
