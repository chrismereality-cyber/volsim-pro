'use client';
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Activity, ShieldCheck, Wallet, Lock, Unlock, ArrowDownCircle, ArrowUpCircle, AlertOctagon, TrendingUp, Cpu } from 'lucide-react';

export default function TitanMasterTerminal() {
  const [data, setData] = useState({ account: { equity: "0.00", profit: "0.00", vault: 0 }, trades: [], logs: [] });
  const [modal, setModal] = useState(null);
  const [hedgeMode, setHedgeMode] = useState(false);

  useEffect(() => {
    const sync = async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/trade/status');
        const json = await res.json();
        setData(prev => ({ ...prev, ...json }));
      } catch (e) { console.error("Sync Interrupted"); }
    };
    const timer = setInterval(sync, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono p-2 lg:p-4">
      {/* HEADER: SYSTEM STATUS */}
      <div className="flex justify-between items-center border-b border-neonBlue/20 pb-4 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black tracking-widest neon-text-blue">TITAN v5.9</h1>
          <div className="hidden md:flex gap-2 text-[10px] text-gray-500">
            <span className="flex items-center gap-1"><Cpu size={12}/> ENGINE: <span className="text-green-500">OPTIMIZED</span></span>
            <span className="flex items-center gap-1"><Activity size={12}/> LATENCY: <span className="text-neonBlue">18ms</span></span>
          </div>
        </div>
        <button onClick={() => setHedgeMode(!hedgeMode)} className={`px-4 py-1 rounded-full border text-[10px] font-bold transition-all ${hedgeMode ? 'bg-neonPink/20 border-neonPink text-neonPink shadow-[0_0_10px_#ff007f]' : 'border-gray-800 text-gray-600'}`}>
          HEDGE ENGINE: {hedgeMode ? "ACTIVE" : "STANDBY"}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* LEFT: FINANCIALS & VAULT */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-800 shadow-inner">
            <p className="text-[10px] text-gray-500 uppercase mb-1">Live Equity</p>
            <h2 className="text-3xl font-bold font-sans">${data.account.equity}</h2>
            <p className={`text-xs mt-1 ${parseFloat(data.account.profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {parseFloat(data.account.profit) >= 0 ? '▲' : '▼'} ${data.account.profit} (Today)
            </p>
          </div>

          <div className="p-4 rounded-lg bg-gray-900/30 border border-neonPink/20">
            <div className="flex justify-between text-[10px] mb-2">
              <span className="text-neonPink flex items-center gap-1"><ShieldCheck size={12}/> AUTO-VAULT</span>
              <span className="text-gray-600">15% ALLOC</span>
            </div>
            <h2 className="text-xl font-bold">${data.account.vault.toFixed(2)}</h2>
            <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
               <div className="bg-neonPink h-full shadow-[0_0_8px_#ff007f]" style={{width: '45%'}} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => setModal('deposit')} className="bg-neonBlue/10 border border-neonBlue/50 text-neonBlue py-3 rounded text-[10px] font-bold hover:bg-neonBlue hover:text-black transition">DEPOSIT</button>
            <button onClick={() => setModal('withdraw')} className="bg-gray-900 border border-gray-800 text-gray-500 py-3 rounded text-[10px] font-bold hover:border-white hover:text-white transition">WITHDRAW</button>
          </div>
        </div>

        {/* CENTER: THE TERMINAL (CHART & EXECUTION) */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          <div className="h-[450px] bg-black border border-gray-800 rounded-lg overflow-hidden relative">
            <iframe 
              src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=1&theme=dark&style=1"
              className="w-full h-full border-none opacity-80"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <button className="bg-green-600/10 border border-green-500/50 text-green-500 py-4 rounded text-xs font-bold hover:bg-green-500 hover:text-white transition">BUY 0.01 BTC</button>
            <button className="bg-red-600/10 border border-red-500/50 text-red-500 py-4 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition">SELL 0.01 BTC</button>
            <button className="bg-red-900/20 border border-red-600 text-red-500 rounded flex items-center justify-center gap-2 text-[10px] font-bold hover:bg-red-600 hover:text-white transition">
              <AlertOctagon size={14}/> PANIC
            </button>
          </div>
        </div>

        {/* RIGHT: ENGINE LOGS & TRACKER */}
        <div className="col-span-12 lg:col-span-3">
          <div className="h-full p-4 bg-gray-900/20 border border-gray-800 rounded-lg">
            <h3 className="text-[10px] text-neonBlue font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={14}/> PROFIT TRACKER
            </h3>
            <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
               {data.trades.length > 0 ? data.trades.map((t, i) => (
                 <div key={i} className="flex justify-between items-center border-b border-gray-800 pb-2">
                   <div>
                     <p className="text-[10px] text-gray-400">BTC TICKET #{t.ticket}</p>
                     <p className={`text-xs font-bold ${t.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                       {t.type === 0 ? 'BUY' : 'SELL'} {t.volume}
                     </p>
                   </div>
                   <span className={t.profit >= 0 ? 'text-green-400' : 'text-red-400'}>${t.profit}</span>
                 </div>
               )) : (
                 <p className="text-[10px] text-gray-600 italic">Scanning market for BTC signals...</p>
               )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS (Deposit/Withdraw) */}
      {modal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-neonBlue/30 p-8 rounded-2xl text-center">
             <h2 className="text-xl font-bold mb-6 text-neonBlue italic">TITAN SECURE DEPOSIT</h2>
             <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
               <QRCodeSVG value="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" size={160} />
             </div>
             <p className="text-[10px] text-gray-400 mb-8 select-all">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</p>
             <button onClick={() => setModal(null)} className="w-full py-3 border border-gray-800 text-gray-500 rounded-lg hover:text-white transition">CLOSE TERMINAL</button>
          </div>
        </div>
      )}
    </div>
  );
}
