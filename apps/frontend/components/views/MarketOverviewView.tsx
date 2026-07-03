'use client';

import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react';

interface MarketTick {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  dailyChange: number;
  liquidityDepth: string;
  lastUpdated: string;
}

export default function MarketOverviewView() {
  const [marketData, setMarketData] = useState<MarketTick[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [flashStates, setFlashStates] = useState<Record<string, { bid?: boolean; ask?: boolean }>>({});

  // Initialize data matrix
  useEffect(() => {
    const initialData: MarketTick[] = [
      {
        symbol: 'XAUUSDm',
        bid: 2345.50,
        ask: 2345.62,
        spread: 0.12,
        dailyChange: 1.45,
        liquidityDepth: 'Deep',
        lastUpdated: new Date().toLocaleTimeString(),
      },
      {
        symbol: 'Volatility 100 (1s) Index',
        bid: 845210.30,
        ask: 845211.10,
        spread: 0.80,
        dailyChange: -0.62,
        liquidityDepth: 'Optimal',
        lastUpdated: new Date().toLocaleTimeString(),
      },
      {
        symbol: 'Volatility 75 Index',
        bid: 320455.15,
        ask: 320456.00,
        spread: 0.85,
        dailyChange: 2.11,
        liquidityDepth: 'High',
        lastUpdated: new Date().toLocaleTimeString(),
      },
    ];
    setMarketData(initialData);
    setLoading(false);

    // Dynamic Micro-Tick Simulator (Simulating actual sub-second bridge pushes)
    const interval = setInterval(() => {
      setMarketData((prevData) =>
        prevData.map((ticker) => {
          // Only update a random asset per cycle to simulate real market conditions
          if (Math.random() > 0.4) {
            const isBidUpdate = Math.random() > 0.5;
            const tickChange = (Math.random() - 0.5) * (ticker.symbol.includes('XAU') ? 0.08 : 1.5);
            
            let newBid = ticker.bid;
            let newAsk = ticker.ask;

            if (isBidUpdate) {
              newBid = +(ticker.bid + tickChange).toFixed(2);
            } else {
              newAsk = +(ticker.ask + tickChange).toFixed(2);
            }

            // Keep spread dynamic but bounded
            const newSpread = +(Math.abs(newAsk - newBid)).toFixed(2);

            // Trigger flash state
            setFlashStates((prev) => ({
              ...prev,
              [ticker.symbol]: {
                ...prev[ticker.symbol],
                [isBidUpdate ? 'bid' : 'ask']: true,
              },
            }));

            // Clear flash after 150ms
            setTimeout(() => {
              setFlashStates((prev) => ({
                ...prev,
                [ticker.symbol]: {
                  ...prev[ticker.symbol],
                  [isBidUpdate ? 'bid' : 'ask']: false,
                },
              }));
            }, 150);

            return {
              ...ticker,
              bid: newBid,
              ask: newAsk,
              spread: newSpread,
              lastUpdated: new Date().toLocaleTimeString(),
            };
          }
          return ticker;
        })
      );
    }, 300);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 font-mono text-xs">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-500" />
        INITIALIZING LIQUIDITY POOL FEED...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engine Status Callout */}
      <div className="flex items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm font-mono text-xs tracking-wider">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            // MARKET OVERVIEW CONTROL STREAM ACTIVE...
          </div>
          <p className="text-zinc-500">Sub-second liquidity tracking engine linked via MT5 router bridge gateway.</p>
        </div>
        <div className="text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-[10px] tracking-widest font-bold">
          BRIDGE: RUNNING
        </div>
      </div>

      {/* Market Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {marketData.map((ticker) => {
          const isPositive = ticker.dailyChange >= 0;
          const flashes = flashStates[ticker.symbol] || {};
          
          return (
            <div 
              key={ticker.symbol} 
              className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-5 hover:border-zinc-700/60 transition-all duration-200 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-zinc-100 font-bold tracking-wide text-sm font-mono">{ticker.symbol}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 uppercase tracking-wider">
                        <Layers className="w-3 h-3 text-zinc-600" /> {ticker.liquidityDepth} Depth
                      </span>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-sm border ${
                    isPositive 
                      ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' 
                      : 'text-rose-400 bg-rose-950/20 border-rose-900/40'
                  }`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{ticker.dailyChange}%
                  </span>
                </div>

                {/* Price Metrics with Flash Enhancements */}
                <div className="grid grid-cols-2 gap-3 my-4 font-mono">
                  <div className={`p-3 border rounded-sm transition-colors duration-150 ${
                    flashes.bid 
                      ? 'bg-emerald-950/40 border-emerald-500/50' 
                      : 'bg-zinc-900/30 border-zinc-800/80'
                  }`}>
                    <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-widest">Bid</span>
                    <span className="text-base font-bold text-zinc-100 tracking-tight">
                      {ticker.bid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className={`p-3 border rounded-sm transition-colors duration-150 ${
                    flashes.ask 
                      ? 'bg-emerald-950/40 border-emerald-500/50' 
                      : 'bg-zinc-900/30 border-zinc-800/80'
                  }`}>
                    <span className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-widest">Ask</span>
                    <span className="text-base font-bold text-zinc-100 tracking-tight">
                      {ticker.ask.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ticker Footer info */}
              <div className="border-t border-zinc-800/60 pt-3 mt-2 flex justify-between items-center text-[10px] font-mono text-zinc-500 tracking-wider">
                <div>
                  SPREAD: <span className="text-zinc-300 font-bold bg-zinc-900 px-1.5 py-0.5 rounded-sm border border-zinc-800">{ticker.spread.toFixed(2)}</span>
                </div>
                <div>
                  ISO: <span className="text-zinc-400">{ticker.lastUpdated}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Liquidity Log Snapshot */}
      <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-4">
        <h4 className="text-xs font-mono text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" /> Live Feed Log
        </h4>
        <div className="bg-zinc-950 p-3 rounded-sm font-mono text-[11px] text-zinc-400 space-y-1 h-32 overflow-y-auto border border-zinc-900/80">
          <p className="text-zinc-600">[03:58:12] Initialized full-duplex WebSocket connection to trading router.</p>
          <p className="text-zinc-500">[03:58:14] XAUUSDm liquidity pool handshake validated (Depth Tier 1).</p>
          <p className="text-zinc-500">[03:58:15] Synthetic indices feed mapping verified via active gateway session.</p>
          <p className="text-emerald-500/80 animate-pulse">[03:58:55] Streaming microsecond tick aggregates... Status stable.</p>
        </div>
      </div>
    </div>
  );
}
