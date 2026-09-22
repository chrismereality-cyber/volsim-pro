'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

export default function PortfolioOverviewView() {
  const connected = useTradingStore((state) => state.connected);
  const balance = useTradingStore((state) => state.balance);
  const equity = useTradingStore((state) => state.equity);
  const floatingPl = useTradingStore((state) => state.floatingPl);
  const positions = useTradingStore((state) => state.positions);

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold">
        Portfolio Overview
      </h2>

      <p className="mt-2 text-sm">
        State Link:{' '}
        {connected ? 'CONNECTED' : 'DISCONNECTED'}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Balance</p>
          <p>{balance.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Equity</p>
          <p>{equity.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Floating P/L</p>
          <p>{floatingPl.toFixed(2)}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400">Open Positions</p>
          <p>{positions.length}</p>
        </div>
      </div>
    </div>
  );
}
