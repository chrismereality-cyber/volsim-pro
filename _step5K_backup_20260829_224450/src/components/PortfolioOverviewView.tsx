'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

const PortfolioOverviewView = () => {
  const connected = useTradingStore((state) => state.connected);
  const balance = useTradingStore((state) => state.balance);
  const equity = useTradingStore((state) => state.equity);
  const floatingPl = useTradingStore((state) => state.floatingPl);
  const portfolioValue = useTradingStore((state) => state.portfolioValue);
  const positions = useTradingStore((state) => state.positions);

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black tracking-wider text-amber-400">
          PORTFOLIO OVERVIEW
        </h2>

        <span
          className={
            connected
              ? 'px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/40'
          }
        >
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">BALANCE</p>
          <p className="text-xl font-bold mt-2">
            ${Number(balance).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">EQUITY</p>
          <p className="text-xl font-bold text-emerald-400 mt-2">
            ${Number(equity).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">FLOATING P/L</p>
          <p className="text-xl font-bold mt-2">
            ${Number(floatingPl).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">PORTFOLIO VALUE</p>
          <p className="text-xl font-bold text-amber-400 mt-2">
            ${Number(portfolioValue).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">OPEN POSITIONS</p>
          <p className="text-xl font-bold mt-2">
            {Array.isArray(positions) ? positions.length : 0}
          </p>
        </div>
      </div>
    </section>
  );
};

export default PortfolioOverviewView;
