'use client';
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, TrendingUp, Wallet, Zap, AlertOctagon, BarChart3 } from 'lucide-react';

export default function TitanTerminal() {
  const [data, setData] = useState({ account: { equity: "0.00", profit: "0.00", vault: 0 }, trades: [] });
  const [showChart, setShowChart] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/trade/status');
        const json = await res.json();
        setData(json);
      } catch (err) { console.error("Terminal Sync Error", err); }
    };
    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      {/* TOP NAV: ENGINES & STATUS */}
      <div className="flex justify-between items-center border-b border-neonBlue/30 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold neon-text-blue">TITAN v5.8.5</h1>
          <span className="bg-neonBlue/10 text-neonBlue text-xs px-2 py-1 rounded border border-neonBlue/50 animate-pulse">
            AUTOPILOT: ACTIVE
          </span>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-gray-400">SERVER: <span className="text-green-400">OPTIMIZED</span></div>
          <div className="text-gray-400">LATENCY: <span className="text-neonBlue">24ms</span></div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* LEFT COLUMN: ACCOUNT & VAULT */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="neon-border p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-gray-400"><Wallet size={16}/> EQUITY</div>
            <div className="text-4xl font-bold text-white">${data.account.equity}</div>
            <div className={`text-sm ${parseFloat(data.account.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.account.profit} (Today)
            </div>
          </div>

          <div className="neon-border p-4 bg-gray-900/50 rounded-lg border-neonPink/30">
            <div className="flex items-center gap-2 mb-2 text-neonPink"><ShieldCheck size={16}/> AUTO-VAULT</div>
            <div className="text-2xl font-bold">${data.account.vault || "0.00"}</div>
            <p className="text-[10px] text-gray-500 mt-2">15% of profits automatically secured per trade.</p>
          </div>
          
          <div className="space-y-2">
            <button className="w-full bg-neonBlue/20 border border-neonBlue text-neonBlue py-2 rounded hover:bg-neonBlue/40 transition">DEPOSIT</button>
            <button className="w-full bg-transparent border border-gray-700 text-gray-400 py-2 rounded hover:border-white hover:text-white transition">WITHDRAW</button>
          </div>
        </div>

        {/* MIDDLE COLUMN: CHART & TERMINAL */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className="neon-border min-h-[400px] rounded-lg bg-gray-900/20 relative overflow-hidden">
            <div className="absolute top-4 left-4 flex gap-2 z-10">
              <button onClick={() => setShowChart(!showChart)} className="bg-black/60 p-2 rounded border border-gray-700 hover:border-neonBlue">
                <BarChart3 size={20} className={showChart ? "text-neonBlue" : "text-gray-500"} />
              </button>
            </div>
            {showChart ? (
               <div className="w-full h-[400px] bg-[url('https://tradingview.com/static/images/free-chart.png')] bg-cover opacity-40 grayscale contrast-125">
                 {/* This would be your TradingView Widget in the next step */}
               </div>
            ) : (
               <div className="flex items-center justify-center h-[400px] text-gray-600 italic">Depth Map Mode Active...</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="bg-green-600/20 border border-green-500 text-green-500 py-4 rounded font-bold hover:bg-green-500 hover:text-white transition">BUY 0.01</button>
            <button className="bg-red-600/20 border border-red-500 text-red-500 py-4 rounded font-bold hover:bg-red-500 hover:text-white transition">SELL 0.01</button>
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT ACTIVITY */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="neon-border p-4 bg-gray-900/50 rounded-lg h-full">
            <div className="flex items-center gap-2 mb-4 text-neonBlue"><Activity size={16}/> ENGINE LOGS</div>
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between text-green-400 border-b border-gray-800 pb-1">
                <span>SIGNAL: XAUUSD</span><span>STRENGTH: 88%</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>RSI OVERBOUGHT</span><span>WAITING...</span>
              </div>
            </div>
            <button className="w-full mt-6 bg-red-900/40 border border-red-600 text-red-500 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold">
              <AlertOctagon size={14}/> PANIC: CLOSE ALL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
