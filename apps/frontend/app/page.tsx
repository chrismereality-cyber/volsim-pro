"use client";
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Terminal, Landmark, ShieldAlert, 
  Cpu, Activity, UserCheck, FileText, Lock, Settings, 
  RefreshCw, Radio, Shield, TrendingUp, HelpCircle
} from 'lucide-react';

export default function PortfolioCommandCenter() {
  const [activeTab, setActiveTab] = useState('OVERVIEW CONSOLE');
  const [metrics, setMetrics] = useState({
    balance: 542.81,
    equity: 542.81,
    floating_pl: 0.00,
    drawdown: 0.00,
    bridgeStatus: "HEALTHY",
    vault_reserve: 21.40,
    accumulated_profit: 42.81,
    web3_block: "OFFLINE"
  });
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    async function pollLiveTelemetry() {
      try {
        const res = await fetch('http://localhost:8000/api/telemetry');
        if (res.ok) {
          const data = await res.json();
          const balance = data.balance || 0.00;
          const deltaProfit = Math.max(0, balance - 500.00); 
          
          setMetrics({
            balance: balance,
            equity: data.equity || 0.00,
            floating_pl: data.floating_pl ?? 0.00,
            drawdown: data.drawdown ?? 0.00,
            bridgeStatus: data.bridgeStatus ?? "HEALTHY",
            vault_reserve: deltaProfit * 0.50,
            accumulated_profit: deltaProfit,
            web3_block: String(data.web3_block)
          });
          setPositions(data.positions || []);
        }
      } catch (err) {
        console.error("Telemetry link error:", err);
      }
    }

    const interval = setInterval(pollLiveTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'OVERVIEW CONSOLE', icon: LayoutDashboard },
    { name: 'TRADING TERMINAL', icon: Terminal },
    { name: 'BROKER INTEGRATION', icon: Radio },
    { name: 'IMMUTABLE VAULT', icon: Landmark },
    { name: 'RISK MANAGEMENT', icon: ShieldAlert },
    { name: 'NEURAL AI CENTER', icon: Cpu },
    { name: 'SYSTEM TELEMETRY', icon: Activity },
    { name: 'ACCOUNT PORTAL', icon: UserCheck },
    { name: 'ARCHIVAL LOGS', icon: FileText },
    { name: 'ADMIN CONTROL ROOM', icon: Lock },
    { name: 'GLOBAL SETTINGS', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#02050a] text-slate-300 font-mono text-[11px] antialiased">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#040811] border-r border-slate-900 flex flex-col justify-between shrink-0 select-none">
        <div>
          <div className="p-5 border-b border-slate-900">
            <span className="text-emerald-400 font-black tracking-wider text-sm animate-pulse block">VOLSIM-PRO // V6.0</span>
          </div>
          <nav className="p-3 space-y-[4px]">
            {navItems.map((item, i) => {
              const isSelected = activeTab === item.name;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    console.log("Switching to panel:", item.name);
                    setActiveTab(item.name);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded transition-all cursor-pointer text-left ${
                    isSelected 
                      ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 font-bold' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 border border-transparent'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="tracking-wide text-[10px] uppercase font-bold">{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-900 bg-slate-950/20">
          <div className="flex items-center space-x-2 border border-emerald-500/10 bg-slate-950 px-3 py-2 rounded">
            <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center font-black text-[9px] text-emerald-400 border border-emerald-500/20">N</div>
            <span className="text-[9px] uppercase tracking-widest text-emerald-500 font-bold">UI MODULE: CYBER TERM</span>
          </div>
        </div>
      </aside>

      {/* PORTAL BODY DECK */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        
        {/* TOP STATUS CONTROL BAR */}
        <div className="flex justify-between items-start border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-base font-black tracking-wider text-white uppercase">{activeTab}</h1>
            <p className="text-slate-500 text-[10px] mt-0.5">VolSim Infrastructure Layer Verification Protocol.</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-slate-950 border border-slate-900 px-3 py-1.5 rounded text-slate-400 flex items-center gap-2 text-[10px]">
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} /> SYNC TIMEOUT: 2S
            </div>
            <span className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded font-bold tracking-widest text-[10px]">
              {metrics.bridgeStatus}
            </span>
          </div>
        </div>

        {/* CONDITIONAL COMPONENT SWITCH MATRIX */}
        {activeTab === 'OVERVIEW CONSOLE' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Portfolio Summary */}
              <div className="bg-[#040811] border border-slate-900 p-5 rounded space-y-4">
                <div className="flex items-center space-x-2 text-blue-400 font-bold tracking-wider uppercase border-b border-slate-950 pb-2">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Portfolio Summary</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Total Balance:</span><span className="font-bold text-white">${metrics.balance.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Total Equity:</span><span className="font-bold text-white">${metrics.equity.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Floating P/L:</span><span className={`font-black ${metrics.floating_pl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{metrics.floating_pl >= 0 ? '+' : ''}${metrics.floating_pl.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Immutable Vault */}
              <div className="bg-[#040811] border border-slate-900 p-5 rounded space-y-4">
                <div className="flex items-center space-x-2 text-purple-400 font-bold tracking-wider uppercase border-b border-slate-950 pb-2">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>4. Immutable Vault (50/50 Split)</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Accumulated Vault Profit:</span><span className="font-bold text-emerald-400">${metrics.accumulated_profit.toFixed(2)}</span></div>
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="bg-[#02050a]/60 border border-slate-950 p-2.5 rounded text-center">
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5 uppercase tracking-wide">Retained Profit</span>
                      <span className="text-blue-400 font-black">${metrics.vault_reserve.toFixed(2)}</span>
                    </div>
                    <div className="bg-[#02050a]/60 border border-slate-950 p-2.5 rounded text-center">
                      <span className="text-[9px] text-slate-500 font-bold block mb-0.5 uppercase tracking-wide">Vault Lock</span>
                      <span className="text-emerald-400 font-black">${metrics.vault_reserve.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardrails */}
              <div className="bg-[#040811] border border-slate-900 p-5 rounded space-y-4">
                <div className="flex items-center space-x-2 text-amber-500 font-bold tracking-wider uppercase border-b border-slate-950 pb-2">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Guardrails & Latency</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Max Breaker Limit:</span><span className="font-bold text-white">10.0%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Auto Shutdown:</span><span className="font-black text-emerald-400 uppercase tracking-widest text-[9px]">Active</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Current Account DD:</span><span className="font-bold text-emerald-400">{metrics.drawdown.toFixed(2)}%</span></div>
                </div>
              </div>
            </div>

            {/* Verification Table */}
            <div className="bg-[#040811] border border-slate-900 rounded overflow-hidden">
              <div className="bg-slate-950/60 border-b border-slate-950 px-4 py-3 text-slate-400 font-bold tracking-wide">
                Live MT5 Running Order Verification Context ({positions.length})
              </div>
              {positions.length === 0 ? (
                <div className="p-8 text-center text-slate-600 tracking-wide">
                  No active open positions tracked on MT5 Terminal account.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#02050a]/40 text-slate-500 text-[10px] uppercase border-b border-slate-950 font-bold">
                      <th className="p-3 pl-4">Ticket</th>
                      <th className="p-3">Asset</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Volume</th>
                      <th className="p-3 text-right pr-4">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-950/50">
                    {positions.map((pos: any, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/20">
                        <td className="p-3 pl-4 text-slate-500">{pos.id}</td>
                        <td className="p-3 font-bold text-white">{pos.asset}</td>
                        <td className="p-3"><span className={pos.type === 'BUY' ? 'text-emerald-400' : 'text-red-400'}>{pos.type}</span></td>
                        <td className="p-3 text-slate-400">{pos.lots}</td>
                        <td className={`p-3 text-right pr-4 font-bold ${pos.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          ${pos.profit.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {activeTab === 'TRADING TERMINAL' && (
          <div className="bg-[#040811] border border-slate-900 p-6 rounded space-y-4 animate-fadeIn">
            <div className="text-blue-400 font-bold border-b border-slate-950 pb-2 flex items-center gap-2"><Terminal className="w-4 h-4"/> NATIVE TRANSACTION INTERFACE</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 border border-slate-900 rounded space-y-2">
                <span className="text-slate-500 block">Execution Asset Wrapper</span>
                <span className="text-base text-white font-bold block">XAUUSDm (Gold Index)</span>
              </div>
              <div className="bg-slate-950 p-4 border border-slate-900 rounded space-y-2">
                <span className="text-slate-500 block">Risk Engine Guardrail Allocation</span>
                <span className="text-base text-emerald-400 font-bold block">PASSIVE AUTO-PILOT RUNNING</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'IMMUTABLE VAULT' && (
          <div className="bg-[#040811] border border-slate-900 p-6 rounded space-y-4 animate-fadeIn">
            <div className="text-purple-400 font-bold border-b border-slate-950 pb-2 flex items-center gap-2"><Landmark className="w-4 h-4"/> PROPRIETARY CLEARINGHOUSE MATRIX</div>
            <p className="text-slate-500 max-w-xl">50% profit allocation is automatically structured. Locked balances cannot be utilized as margin collateral or drawn by execution models.</p>
            <div className="bg-slate-950 p-4 border border-slate-900 rounded flex justify-between items-center">
              <div>
                <span className="text-slate-400 font-bold block">SECURE VAULT RESERVE</span>
                <span className="text-[10px] text-slate-600">Archived from live trading handle exposure.</span>
              </div>
              <span className="text-lg font-black text-emerald-400">${metrics.vault_reserve.toFixed(2)}</span>
            </div>
          </div>
        )}

        {activeTab === 'RISK MANAGEMENT' && (
          <div className="bg-[#040811] border border-slate-900 p-6 rounded space-y-4 animate-fadeIn">
            <div className="text-amber-500 font-bold border-b border-slate-950 pb-2 flex items-center gap-2"><Shield className="w-4 h-4"/> RISK ENGINE CIRUIT CODES</div>
            <div className="space-y-2 text-slate-400">
              <div className="flex justify-between p-2.5 bg-slate-950 rounded border border-slate-900"><span>Daily Cumulative Loss Limit</span><span className="text-white font-bold">2.5% Max</span></div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded border border-slate-900"><span>Maximum Drawdown Breaker</span><span className="text-red-400 font-bold">10.0% Max Cutoff</span></div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded border border-slate-900"><span>Current Status</span><span className="text-emerald-400 font-bold tracking-widest uppercase">SECURE</span></div>
            </div>
          </div>
        )}

        {/* CATCH-ALL FOR UNMAPPED VIEWS */}
        {['OVERVIEW CONSOLE', 'TRADING TERMINAL', 'IMMUTABLE VAULT', 'RISK MANAGEMENT'].indexOf(activeTab) === -1 && (
          <div className="p-12 border border-dashed border-slate-900 bg-[#040811]/30 rounded text-center text-slate-500 space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{activeTab} LAYER</div>
            <p className="max-w-md mx-auto text-[10px] text-slate-600">
              Subgrid pipeline offline. Ready to match underlying FastAPI database schema bindings.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}