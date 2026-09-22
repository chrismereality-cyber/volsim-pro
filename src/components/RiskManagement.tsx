'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

const RiskManagement = () => {
  const currentDrawdown = useTradingStore(
    (state) => state.currentDrawdown
  );

  const maxDrawdown = useTradingStore(
    (state) => state.maxDrawdown
  );

  const marginUsage = useTradingStore(
    (state) => state.marginUsage
  );

  const riskPerTrade = useTradingStore(
    (state) => state.riskPerTrade
  );

  const netExposure = useTradingStore(
    (state) => state.netExposure
  );

  const valueAtRisk = useTradingStore(
    (state) => state.valueAtRisk
  );

  const riskStatus = useTradingStore(
    (state) => state.riskStatus
  );

  const liquidationWarning = useTradingStore(
    (state) => state.liquidationWarning
  );

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-black tracking-wider text-amber-400">
          RISK MANAGEMENT
        </h2>

        <span
          className={
            liquidationWarning
              ? 'px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/40'
              : 'px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          }
        >
          {liquidationWarning ? 'LIQUIDATION WARNING' : 'SYSTEM SECURE'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">CURRENT DRAWDOWN</p>
          <p className="text-xl font-bold text-red-400 mt-2">
            {Number(currentDrawdown).toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">MAX DRAWDOWN</p>
          <p className="text-xl font-bold mt-2">
            {Number(maxDrawdown).toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">MARGIN USAGE</p>
          <p className="text-xl font-bold text-amber-300 mt-2">
            {Number(marginUsage).toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">RISK / TRADE</p>
          <p className="text-xl font-bold text-indigo-400 mt-2">
            {Number(riskPerTrade).toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">NET EXPOSURE</p>
          <p className="text-xl font-bold text-sky-400 mt-2">
            ${Number(netExposure).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">VALUE AT RISK</p>
          <p className="text-xl font-bold text-purple-400 mt-2">
            ${Number(valueAtRisk).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-500">RISK STATUS</p>
          <p className="text-xl font-bold text-emerald-400 mt-2">
            {riskStatus}
          </p>
        </div>
      </div>
    </section>
  );
};

export default RiskManagement;
