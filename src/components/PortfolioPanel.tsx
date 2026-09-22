'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

const PortfolioPanel = () => {
  const balance = useTradingStore((state) => state.balance);
  const equity = useTradingStore((state) => state.equity);
  const floatingPl = useTradingStore((state) => state.floatingPl);
  const portfolioValue = useTradingStore(
    (state) => state.portfolioValue
  );

  return (
    <div className="p-4 border rounded shadow-md bg-slate-900 text-white">
      <h2 className="text-xl font-bold mb-4">
        Portfolio Command Center
      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div>
          <p className="text-sm text-gray-400">
            Total Balance
          </p>
          <p className="text-lg font-mono">
            {balance.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">
            Total Equity
          </p>
          <p className="text-lg font-mono">
            {equity.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">
            Floating P/L
          </p>
          <p className="text-lg font-mono">
            {floatingPl.toFixed(2)}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-400">
            Portfolio Value
          </p>
          <p className="text-lg font-mono">
            {portfolioValue.toFixed(2)}
          </p>
        </div>

      </div>
    </div>
  );
};

export default PortfolioPanel;
