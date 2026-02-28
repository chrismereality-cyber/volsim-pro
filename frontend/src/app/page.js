'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({ account: { equity: "0.00", profit: "0.00", vault: 0 }, trades: [] });

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
    <div className="min-h-screen bg-[#050505] text-blue-400 p-6 font-mono">
      <div className="border border-blue-900 p-4 rounded-xl bg-blue-950/5">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-lg font-black text-white italic">TITAN v5.8</h1>
            <span className="text-[9px] bg-blue-500/10 px-2 py-1 rounded border border-blue-500/30">MICRO_GROWTH_MODE</span>
        </div>
        
        <div className="text-center py-8 bg-black/40 rounded-lg border border-white/5 mb-6">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Live Account Equity</p>
          <p className="text-5xl font-black text-white">${data.account.equity}</p>
          <p className={`text-xl font-bold mt-2 ${parseFloat(data.account.profit) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {parseFloat(data.account.profit) >= 0 ? '+' : ''}{data.account.profit}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={()=>send('BUY')} className="bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">BUY 0.01</button>
          <button onClick={()=>send('SELL')} className="bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-xl font-black shadow-lg shadow-rose-900/20 active:scale-95 transition-all">SELL 0.01</button>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5">
            <button onClick={()=>send('CLOSE_ALL')} className="w-full bg-zinc-900 text-zinc-400 py-3 rounded-lg text-xs font-bold uppercase tracking-widest border border-white/5 active:bg-zinc-800">
                Panic: Close All Positions
            </button>
        </div>
      </div>
    </div>
  );
}