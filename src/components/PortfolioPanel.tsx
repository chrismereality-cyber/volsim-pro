import React from 'react';
import { useGlobalState } from '../context/GlobalStateContext';

const PortfolioPanel = () => {
  const globalState = useGlobalState();
  const portfolio = globalState?.portfolio || {};

  return (
    <div className='p-4 border rounded shadow-md bg-slate-900 text-white'>
      <h2 className='text-xl font-bold mb-4'>Portfolio Command Center</h2>
      <div className='grid grid-cols-2 gap-4'>
        <div>
          <p className='text-sm text-gray-400'>Total Balance</p>
          <p className='text-lg font-mono'>{portfolio.total_balance || '0.00'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-400'>Total Equity</p>
          <p className='text-lg font-mono'>{portfolio.total_equity || '0.00'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-400'>Floating P/L</p>
          <p className='text-lg font-mono'>{portfolio.floating_pl || '0.00'}</p>
        </div>
        <div>
          <p className='text-sm text-gray-400'>Margin Level</p>
          <p className='text-lg font-mono'>{portfolio.margin_level || '0'}%</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioPanel;
