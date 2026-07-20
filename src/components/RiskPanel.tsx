import React from 'react';
import { useGlobalState } from '../context/GlobalStateContext';

const RiskPanel = () => {
  const globalState = useGlobalState();
  const risk = globalState?.risk;

  if (!risk) {
    return <div className='p-4 text-green-500 font-mono'>// AWAITING LINK HANDSHAKE...</div>;
  }

  return (
    <div className='p-4 border rounded shadow-md'>
      <h2 className='text-xl font-bold'>Risk Management</h2>
      <div className='mt-2'>
        <p>Current Drawdown: {risk.current_drawdown ?? '0.00'}%</p>
        <p>Margin Usage: {risk.margin_usage ?? '0.00'}%</p>
        <p>Risk Score: {risk.risk_score ?? '0.00'}</p>
      </div>
    </div>
  );
};

export default RiskPanel;
