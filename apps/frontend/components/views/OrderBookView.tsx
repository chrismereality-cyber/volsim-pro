'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ArrowUpDown, ChevronDown } from 'lucide-react';

interface OrderBookRow {
  price: number;
  size: number;
  total: number;
}

export default function OrderBookView() {
  const [activeAsset, setActiveAsset] = useState<string>('XAUUSDm');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [bids, setBids] = useState<OrderBookRow[]>([]);
  const [asks, setAsks] = useState<OrderBookRow[]>([]);
  const [midPrice, setMidPrice] = useState<number>(2345.56);
  const [spread, setSpread] = useState<number>(0.02);

  const assets = ['XAUUSDm', 'Volatility 100 (1s) Index', 'Volatility 75 Index'];

  // Base state definition generator based on chosen symbol
  useEffect(() => {
    const generateInitialBook = () => {
      let basePrice = 2345.50;
      let tickStep = 0.05;
      let sizeMultiplier = 1;

      if (activeAsset.includes('100 (1s)')) {
        basePrice = 845210.30;
        tickStep = 0.25;
        sizeMultiplier = 0.1;
      } else if (activeAsset.includes('75')) {
        basePrice = 320455.15;
        tickStep = 0.20;
        sizeMultiplier = 0.5;
      }

      // Generate 8 levels of Asks (sorted from highest to lowest price)
      const initialAsks: OrderBookRow[] = Array.from({ length: 8 }, (_, i) => {
        const offset = (8 - i) * tickStep;
        return {
          price: +(basePrice + offset + (tickStep * 0.4)).toFixed(2),
          size: +(Math.random() * 15 * sizeMultiplier + 0.5).toFixed(2),
          total: 0
        };
      });

      // Generate 8 levels of Bids (sorted from highest to lowest price)
      const initialBids: OrderBookRow[] = Array.from({ length: 8 }, (_, i) => {
        const offset = i * tickStep;
        return {
          price: +(basePrice - offset - (tickStep * 0.4)).toFixed(2),
          size: +(Math.random() * 18 * sizeMultiplier + 0.5).toFixed(2),
          total: 0
        };
      });

      // Recalculate Totals
      let askAccumulator = 0;
      for (let i = initialAsks.length - 1; i >= 0; i--) {
        askAccumulator += initialAsks[i].size;
        initialAsks[i].total = +askAccumulator.toFixed(2);
      }

      let bidAccumulator = 0;
      for (let i = 0; i < initialBids.length; i++) {
        bidAccumulator += initialBids[i].size;
        initialBids[i].total = +bidAccumulator.toFixed(2);
      }

      setAsks(initialAsks);
      setBids(initialBids);
      
      const currentMid = (initialAsks[initialAsks.length - 1].price + initialBids[0].price) / 2;
      setMidPrice(+currentMid.toFixed(2));
      setSpread(+(initialAsks[initialAsks.length - 1].price - initialBids[0].price).toFixed(2));
    };

    generateInitialBook();
  }, [activeAsset]);

  // Microsecond Order Engine Simulator (Simulates real-time limit order modifications)
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random side to fluctuate: 0 = Bid side, 1 = Ask side
      const side = Math.random() > 0.5 ? 0 : 1;
      const targetIndex = Math.floor(Math.random() * 8);

      if (side === 0 && bids.length > 0) {
        setBids(prevBids => {
          const next = [...prevBids];
          const sizeDelta = (Math.random() - 0.5) * (activeAsset.includes('XAU') ? 2 : 0.5);
          next[targetIndex].size = Math.max(0.1, +(next[targetIndex].size + sizeDelta).toFixed(2));
          
          let accum = 0;
          return next.map((row, i) => {
            accum += row.size;
            return { ...row, total: +accum.toFixed(2) };
          });
        });
      } else if (side === 1 && asks.length > 0) {
        setAsks(prevAsks => {
          const next = [...prevAsks];
          const sizeDelta = (Math.random() - 0.5) * (activeAsset.includes('XAU') ? 2 : 0.5);
          next[targetIndex].size = Math.max(0.1, +(next[targetIndex].size + sizeDelta).toFixed(2));
          
          let accum = 0;
          for (let i = next.length - 1; i >= 0; i--) {
            accum += next[i].size;
            next[i].total = +accum.toFixed(2);
          }
          return next;
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [bids.length, asks.length, activeAsset]);

  // Determine relative size weight for visualization bars
  const maxTotal = Math.max(
    asks.length > 0 ? asks[0].total : 1, 
    bids.length > 0 ? bids[bids.length - 1].total : 1
  );

  return (
    <div className="space-y-4">
      {/* Header Log and Asset Switcher combo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm font-mono text-xs tracking-wider">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            // LIQUIDITY ORDER BOOK LAYER HANDSHAKE ACTIVE...
          </div>
          <p className="text-zinc-500">Real-time composite bridge cross-matching matrix engine.</p>
        </div>
        
        {/* Customized Dropdown Select */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-zinc-900 border border-zinc-800 px-4 py-1.5 rounded text-[11px] font-bold tracking-wide text-zinc-300 flex items-center gap-2 min-w-[180px] justify-between focus:outline-none focus:border-zinc-700"
          >
            <span>{activeAsset}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-sm shadow-2xl z-50 overflow-hidden font-bold">
              {assets.map((asset) => (
                <button
                  key={asset}
                  onClick={() => {
                    setActiveAsset(asset);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-[11px] transition-colors hover:bg-zinc-800/80 ${
                    activeAsset === asset ? 'text-emerald-400 bg-zinc-950/40' : 'text-zinc-400'
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Ladder Panel */}
      <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm overflow-hidden shadow-xl font-mono text-xs">
        {/* Table Column Headers */}
        <div className="grid grid-cols-3 p-3 text-zinc-500 border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-widest font-bold">
          <div>Price ({activeAsset.includes('XAU') ? 'USD' : 'IDX'})</div>
          <div className="text-right">Size</div>
          <div className="text-right">Total</div>
        </div>

        {/* Asks Matrix Block (Sells) */}
        <div className="flex flex-col">
          {asks.map((ask, idx) => {
            const widthPercentage = Math.min(100, (ask.total / maxTotal) * 100);
            return (
              <div key={`ask-${idx}`} className="relative grid grid-cols-3 px-3 py-1.5 hover:bg-zinc-900/40 transition-colors text-rose-400 font-medium">
                {/* Visual Density Overlay bar representing structural sell resistance */}
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-rose-950/10 pointer-events-none transition-all duration-150"
                  style={{ width: `${widthPercentage}%` }}
                />
                <div className="z-10">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-right text-zinc-300 z-10">{ask.size.toFixed(2)}</div>
                <div className="text-right text-zinc-500 z-10">{ask.total.toFixed(2)}</div>
              </div>
            );
          })}
        </div>

        {/* Centralized Mid-Market Spread Engine Banner */}
        <div className="grid grid-cols-3 px-3 py-2.5 bg-zinc-900/40 border-y border-zinc-800/60 font-bold tracking-wide">
          <div className="text-zinc-200 text-sm self-center">
            {midPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-center text-zinc-500 text-[10px] uppercase tracking-wider self-center col-span-2 flex justify-end items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3 text-zinc-600" /> 
            Spread: <span className="text-zinc-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded-sm">{spread.toFixed(2)}</span>
          </div>
        </div>

        {/* Bids Matrix Block (Buys) */}
        <div className="flex flex-col">
          {bids.map((bid, idx) => {
            const widthPercentage = Math.min(100, (bid.total / maxTotal) * 100);
            return (
              <div key={`bid-${idx}`} className="relative grid grid-cols-3 px-3 py-1.5 hover:bg-zinc-900/40 transition-colors text-emerald-400 font-medium">
                {/* Visual Density Overlay bar representing structural buy support */}
                <div 
                  className="absolute right-0 top-0 bottom-0 bg-emerald-950/10 pointer-events-none transition-all duration-150"
                  style={{ width: `${widthPercentage}%` }}
                />
                <div className="z-10">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-right text-zinc-300 z-10">{bid.size.toFixed(2)}</div>
                <div className="text-right text-zinc-500 z-10">{bid.total.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
