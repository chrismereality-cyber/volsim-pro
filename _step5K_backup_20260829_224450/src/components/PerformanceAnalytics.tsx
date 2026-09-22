'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

const PerformanceAnalytics = () => {
  const winRate = useTradingStore((state) => state.winRate);
  const profitFactor = useTradingStore((state) => state.profitFactor);
  const expectancy = useTradingStore((state) => state.expectancy);
  const sharpeRatio = useTradingStore((state) => state.sharpeRatio);
  const totalTrades = useTradingStore((state) => state.totalTrades);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-black tracking-wider text-amber-400 mb-5">
        PERFORMANCE ANALYTICS
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">WIN RATE</p>
          <p className="text-xl font-bold mt-2">
            {Number(winRate).toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">PROFIT FACTOR</p>
          <p className="text-xl font-bold mt-2">
            {Number(profitFactor).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">EXPECTANCY</p>
          <p className="text-xl font-bold text-emerald-400 mt-2">
            {Number(expectancy).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">SHARPE RATIO</p>
          <p className="text-xl font-bold mt-2">
            {Number(sharpeRatio).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">TOTAL TRADES</p>
          <p className="text-xl font-bold mt-2">
            {Number(totalTrades)}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PerformanceAnalytics;
