'use client';
import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Wallet, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, AlertOctagon } from 'lucide-react';

export default function TitanLive() {
  const [data, setData] = useState({ account: { equity: "0.00", profit: "0.00", vault: 0 }, trades: [] });
  const [hedgeActive, setHedgeActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/trade/status');
        const json = await res.json();
        setData(json);
      } catch (e) { console.error("Sync Lost"); }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = (type) => {
    alert(`${type} Command Sent to MT5 Bridge`);
    // Future: fetch('.../api/trade/command', {method: 'POST', body: JSON.stringify({action: type})})
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <div className="flex justify-between items-center border-b border-neonBlue/20 pb-4 mb-4">
        <h1 className="text-xl font-bold text-neonBlue">TITAN v5.8.7 [BTC ONLY]</h1>
        <button onClick={() => setHedgeActive(!hedgeActive)} className={`px-3 py-1 rounded border text-xs ${hedgeActive ? 'bg-neonPink/20 border-neonPink text-neonPink' : 'border-gray-700 text-gray-500'}`}>
          HEDGE: {hedgeActive ? "LOCKED" : "OFF"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="border border-neonBlue/30 p-4 bg-gray-900/40 rounded">
            <div className="text-[10px] text-neonBlue">BTC EQUITY</div>
            <div className="text-3xl font-bold">${data.account.equity}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleAction('DEPOSIT')} className="flex items-center justify-center gap-2 bg-blue-600/20 border border-blue-500 text-blue-400 py-3 rounded text-xs hover:bg-blue-500 hover:text-white">
              <ArrowDownCircle size={14}/> DEPOSIT
            </button>
            <button onClick={() => handleAction('WITHDRAW')} className="flex items-center justify-center gap-2 bg-gray-800 border border-gray-600 text-gray-300 py-3 rounded text-xs hover:bg-white hover:text-black">
              <ArrowUpCircle size={14}/> WITHDRAW
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9">
          <div className="border border-neonBlue/20 h-[500px] w-full rounded overflow-hidden">
            <iframe 
              src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=1&theme=dark&style=1&timezone=Etc%2FUTC"
              className="w-full h-full border-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <button onClick={() => handleAction('BUY')} className="bg-green-600/20 border border-green-500 text-green-500 py-4 rounded font-bold hover:bg-green-500 hover:text-white">BUY 0.01 BTC</button>
        <button onClick={() => handleAction('SELL')} className="bg-red-600/20 border border-red-500 text-red-500 py-4 rounded font-bold hover:bg-red-500 hover:text-white">SELL 0.01 BTC</button>
        <button onClick={() => handleAction('PANIC')} className="col-span-2 lg:col-span-1 bg-red-900/40 border border-red-600 text-red-500 py-4 rounded font-bold flex items-center justify-center gap-2">
          <AlertOctagon size={18}/> PANIC: CLOSE BTC
        </button>
      </div>
    </div>
  );
}
