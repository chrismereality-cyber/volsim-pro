'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

export default function PerformanceAnalytics() {
  const winRate = useTradingStore((state) => state.winRate);
  const profitFactor = useTradingStore((state) => state.profitFactor);
  const expectancy = useTradingStore((state) => state.expectancy);
  const sharpeRatio = useTradingStore((state) => state.sharpeRatio);
  const totalTrades = useTradingStore((state) => state.totalTrades);
  const connected = useTradingStore((state) => state.connected);

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold">
        Performance Analytics
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-gray-400">Win Rate</p>
          <p>{winRate.toFixed(2)}%</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Profit Factor</p>
          <p>{profitFactor.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Expectancy</p>
          <p>{expectancy.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Sharpe Ratio</p>
          <p>{sharpeRatio.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Total Trades</p>
          <p>{totalTrades}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">State Link</p>
          <p>{connected ? 'CONNECTED' : 'DISCONNECTED'}</p>
        </div>
      </div>
    </div>
  );
}
