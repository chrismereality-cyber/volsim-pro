'use client';

import React from 'react';
import { useTradingStore } from '../../store/useTradingStore';

const RiskPanel = () => {
  const currentDrawdown = useTradingStore(
    (state) => state.currentDrawdown
  );

  const marginUsage = useTradingStore(
    (state) => state.marginUsage
  );

  const riskStatus = useTradingStore(
    (state) => state.riskStatus
  );

  const valueAtRisk = useTradingStore(
    (state) => state.valueAtRisk
  );

  const liquidationWarning = useTradingStore(
    (state) => state.liquidationWarning
  );

  return (
    <div className="p-4 border rounded shadow-md">
      <h2 className="text-xl font-bold">
        Risk Management
      </h2>

      <div className="mt-3 space-y-2">

        <p>
          Current Drawdown:{' '}
          {currentDrawdown.toFixed(2)}%
        </p>

        <p>
          Margin Usage:{' '}
          {marginUsage.toFixed(2)}%
        </p>

        <p>
          Value at Risk:{' '}
          {valueAtRisk.toFixed(2)}
        </p>

        <p>
          Risk Status:{' '}
          {riskStatus}
        </p>

        <p>
          Liquidation Warning:{' '}
          {liquidationWarning ? 'ACTIVE' : 'CLEAR'}
        </p>

      </div>
    </div>
  );
};

export default RiskPanel;
