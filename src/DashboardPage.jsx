import React from 'react';
import { useTelemetry } from './useTelemetry';

export default function DashboardPage() {
  // Correctly target your local FastAPI port (default fallback inside hook)
  const { data, error } = useTelemetry("http://127.0.0.1:10000");

  const getStatusColor = (status) => {
    if (status === 'HEALTHY' || status === 'CONNECTED') return 'bg-green-500/10 text-green-400 border-green-500/30';
    if (status === 'BRIDGE_OFFLINE' || !status) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'; 
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  };

  // Safe destructuring with structural fallbacks to avoid rendering crashes
  const account = data?.account_info || { balance: 0.0, equity: 0.0, free_margin: 0.0, spread: 0 };
  const analytics = data?.analytics || { win_rate: 0, loss_rate: 0, profit_factor: 0, max_drawdown_cash: 0, net_profit: 0, total_trades: 0 };
  
  // Calculate a structural status string based on whether balance metrics are incoming
  const dynamicStatus = account.balance > 0 ? 'HEALTHY' : 'BRIDGE_OFFLINE';

  return (
    <div className="p-6 bg-[#030712] text-slate-100 min-h-screen font-sans tracking-wide">
      {/* Top Header Grid */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-900 pb-4">
        <h1 className="text-xl font-bold tracking-widest text-[#3b82f6]">
          VOLSIM-PRO // ENTERPRISE v6.0
        </h1>
        <span className={`px-4 py-1.5 rounded text-xs font-black tracking-widest border uppercase transition-all duration-300 ${getStatusColor(dynamicStatus)}`}>
          {dynamicStatus}
        </span>
      </div>

      {/* Main Multi-Grid Array */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* 1. PORTFOLIO COMMAND CENTER */}
        <div className="p-5 bg-[#090d16] border border-slate-900 rounded-lg shadow-2xl">
          <h2 className="text-xs font-black text-[#3b82f6] tracking-wider mb-5 uppercase">
            1. Portfolio Command Center
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Total Balance:</span>
              <span className="font-mono font-bold text-base text-slate-100">${(account.balance || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Total Equity:</span>
              <span className="font-mono font-bold text-base text-slate-100">${(account.equity || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-900">
              <span className="text-slate-400 font-medium">Max Historical Drawdown:</span>
              <span className="font-mono font-black text-sm text-[#ef4444]">${(analytics.max_drawdown_cash || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* 2. IMMUTABLE VAULT */}
        <div className="p-5 bg-[#090d16] border border-slate-900 rounded-lg shadow-2xl">
          <h2 className="text-xs font-black text-[#3b82f6] tracking-wider mb-5 uppercase">
            2. Immutable Vault (50/50 Split)
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Accumulated Net Profit:</span>
              <span className="font-mono font-bold text-base text-slate-100">${(analytics.net_profit || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Vault Lock Reserve:</span>
              <span className="font-mono font-bold text-slate-100">${(data?.vault_total_balance || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-900">
              <span className="text-slate-400 font-medium">Status:</span>
              <span className="text-xs font-black text-[#22c55e] tracking-widest uppercase">Secured</span>
            </div>
          </div>
        </div>

        {/* 3. RISK PROTECTION GUARDRAILS & ANALYTICS */}
        <div className="p-5 bg-[#090d16] border border-slate-900 rounded-lg shadow-2xl">
          <h2 className="text-xs font-black text-[#3b82f6] tracking-wider mb-5 uppercase">
            3. Live Analytics Matrix
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Win Rate:</span>
              <span className="font-mono font-bold text-slate-100">{analytics.win_rate}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Profit Factor:</span>
              <span className="font-mono font-bold text-emerald-400">{analytics.profit_factor}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-900">
              <span className="text-slate-400 font-medium">Total Handled Trades:</span>
              <span className="font-mono font-bold text-slate-100">{analytics.total_trades}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Second Row Array */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 4. TELEMETRY & EXECUTION CENTER */}
        <div className="p-5 bg-[#090d16] border border-slate-900 rounded-lg shadow-2xl">
          <h2 className="text-xs font-black text-[#3b82f6] tracking-wider mb-5 uppercase">
            4. Telemetry & Execution Center
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Live Open Positions:</span>
              <span className="font-mono font-bold text-slate-100">{data?.active_positions_count || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Current Spread:</span>
              <span className="font-mono font-bold text-[#3b82f6]">{account.spread || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-900">
              <span className="text-slate-400 font-medium">Active Hedges:</span>
              <span className="font-mono font-bold text-slate-100">{data?.active_hedges?.length || 0}</span>
            </div>
          </div>
        </div>

        <div className="col-span-2"></div>
      </div>

      {/* Background Error Stream System Output */}
      {error && (
        <div className="mt-8 p-3 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded font-mono shadow-inner">
          [Telemetry Link Drop]: {error}
        </div>
      )}
    </div>
  );
}
