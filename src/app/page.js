'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ account: { equity: "0.00", profit: "0.00", vault: 0 }, trades: [] });
  const [view, setView] = useState('TRADE');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/trade/status');
        const json = await res.json();
        if (json.account) setData(json);
      } catch (e) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const send = (action) => fetch('https://volsim-pro.onrender.com/api/trade/order', {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ action, lot: 0.01, symbol: "BTCUSDm" })
  });

  return (
    <div className="min-h-screen bg-[#020408] text-slate-300 font-sans p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <h1 className="text-blue-500 font-black italic">TITAN ELITE v5.8</h1>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded">MICRO-MODE ACTIVE</span>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-2xl border border-blue-500/20 text-center">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Live Equity ($20 Target)</p>
            <p className="text-4xl font-mono font-black text-white">${data.account.equity}</p>
            <p className={`text-xl font-mono font-bold ${parseFloat(data.account.profit) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {parseFloat(data.account.profit) >= 0 ? '+' : ''}{data.account.profit}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>send('BUY')} className="py-4 bg-emerald-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition">BUY</button>
            <button onClick={()=>send('SELL')} className="py-4 bg-rose-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition">SELL</button>
        </div>

        <div className="bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-[11px]">
            <p className="text-slate-500 mb-2 uppercase font-bold">Active Tickets ({data.trades?.length || 0})</p>
            {data.trades?.map((t, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-slate-400">{t.type} 0.01</span>
                    <span className={t.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>${t.profit}</span>
                </div>
            ))}
        </div>

        <button onClick={()=>send('CLOSE_ALL')} className="w-full py-3 bg-white/5 text-slate-400 font-bold rounded-xl border border-white/10 uppercase text-xs">
            Close All Positions
        </button>
      </div>
    </div>
  );
}