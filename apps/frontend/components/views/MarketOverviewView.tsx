'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Radio, ArrowUpRight, ArrowDownRight, Terminal } from 'lucide-react';

interface MarketSnapshot {
  symbol: string;
  name: string;
  depthType: string;
  basePrice: number;
  decimals: number;
  spread: number;
  volatility: number;
  change24h: number;
  bid: number;
  ask: number;
}

const INITIAL_MARKETS: MarketSnapshot[] = [
  {
    symbol: 'XAUUSDm',
    name: 'Gold Spot (m)',
    depthType: 'DEEP DEPTH',
    basePrice: 4165.50,
    decimals: 2,
    spread: 0.12,
    volatility: 0.25,
    change24h: 1.45,
    bid: 4165.50,
    ask: 4165.62
  },
  {
    symbol: '1HZ100V',
    name: 'Volatility 100 (1s) Index',
    depthType: 'OPTIMAL DEPTH',
    basePrice: 4181.44,
    decimals: 2,
    spread: 0.35,
    volatility: 0.45,
    change24h: -0.62,
    bid: 4181.44,
    ask: 4181.79
  },
  {
    symbol: '1HZ75V',
    name: 'Volatility 75 Index',
    depthType: 'HIGH DEPTH',
    basePrice: 172450.00,
    decimals: 2,
    spread: 4.80,
    volatility: 12.5,
    change24h: 2.11,
    bid: 172450.00,
    ask: 172454.80
  }
];

export default function MarketOverviewView() {
  const [markets, setMarkets] = useState<MarketSnapshot[]>(INITIAL_MARKETS);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('17:30:10');
  const [logs, setLogs] = useState<string[]>([
    'Initialized full-duplex WebSocket connection to trading router.',
    'XAUUSDm liquidity pool handshake validated (Depth Tier 1).',
    'Synthetic indices feed mapping verified via active gateway session.',
    'Streaming microsecond tick aggregates... Status stable.'
  ]);

  useEffect(() => {
    const tickInterval = setInterval(() => {
      // 1. Update live prices and percentages across all layout matrices
      setMarkets(prevMarkets =>
        prevMarkets.map(market => {
          const tickDrift = (Math.random() - 0.5) * market.volatility;
          const nextBid = Math.max(market.basePrice * 0.5, market.bid + tickDrift);
          const nextAsk = nextBid + market.spread + (Math.random() - 0.5) * (market.spread * 0.05);

          // Micro-fluctuate 24h percentage change based on trend direction
          const pctDrift = (Math.random() - 0.5) * 0.005;
          const nextChange = market.change24h + pctDrift;

          return {
            ...market,
            bid: nextBid,
            ask: nextAsk,
            change24h: nextChange
          };
        })
      );

      // 2. Roll forward standard execution timing clocks
      const now = new Date();
      setCurrentTimeStr(now.toTimeString().split(' ')[0]);

      // 3. Occasionally cycle high-velocity log tracks to match UI outputs in image_07466c.png
      if (Math.random() > 0.85) {
        setLogs(prev => {
          const timeLabel = `[${new Date().toTimeString().split(' ')[0]}]`;
          const activeSymbols = ['XAUUSDm', '1HZ75V', '1HZ100V'];
          const randomSymbol = activeSymbols[Math.floor(Math.random() * activeSymbols.length)];
          const newLog = `${timeLabel} Inbound quote processed for ${randomSymbol} -> Delta: ${(Math.random() - 0.5).toFixed(4)} pts`;

          const expanded = [...prev, newLog];
          if (expanded.length > 5) expanded.shift(); // Keep visual structure locked
          return expanded;
        });
      }
    }, 400);

    return () => clearInterval(tickInterval);
  }, []);

  return (
    <div className="space-y-6 font-mono text-xs">

      {/* Top Router Gateway Status Stream Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm tracking-wider gap-3">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            // MARKET OVERVIEW CONTROL STREAM ACTIVE...
          </div>
          <p className="text-zinc-500">Sub-second liquidity tracking engine linked via MT5 router bridge gateway.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-zinc-900 border border-zinc-850 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          BRIDGE: <span className="text-emerald-400">RUNNING</span>
        </div>
      </div>

      {/* Grid Cluster Layout mapping the 3 critical core indices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {markets.map((market) => {
          const isPositive = market.change24h >= 0;
          const spreadValue = market.ask - market.bid;

          return (
            <div key={market.symbol} className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-4 space-y-4 shadow-xl">

              {/* Card Meta Row */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-zinc-200 font-bold text-[13px] tracking-wide">{market.symbol}</h3>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">{market.depthType}</div>
                </div>

                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold text-[10px] border ${
                  isPositive
                    ? 'border-emerald-950 bg-emerald-950/30 text-emerald-400'
                    : 'border-rose-950 bg-rose-950/30 text-rose-400'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isPositive ? '+' : ''}{market.change24h.toFixed(2)}%
                </div>
              </div>

              {/* Core Liquidity Bid / Ask Spread Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-850 bg-zinc-900/40 p-2.5 rounded-sm relative">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">BID</div>
                  <div className="text-zinc-100 font-bold text-[14px]">
                    {market.bid.toLocaleString(undefined, { minimumFractionDigits: market.decimals, maximumFractionDigits: market.decimals })}
                  </div>
                </div>

                <div className="border border-zinc-850 bg-zinc-900/40 p-2.5 rounded-sm relative">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">ASK</div>
                  <div className="text-zinc-100 font-bold text-[14px]">
                    {market.ask.toLocaleString(undefined, { minimumFractionDigits: market.decimals, maximumFractionDigits: market.decimals })}
                  </div>
                </div>
              </div>

              {/* Dynamic Bottom Metric Row */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[10px] font-semibold text-zinc-500">
                <div className="flex items-center gap-1.5">
                  SPREAD: <span className="text-zinc-300 font-bold">{spreadValue.toFixed(2)}</span>
                </div>
                <div className="text-zinc-600 flex items-center gap-1">
                  ISO: <span className="text-zinc-400 font-bold">{currentTimeStr}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Live Feed Terminal Log Display */}
      <div className="border border-zinc-800 bg-zinc-950/40 rounded-sm overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-900 bg-zinc-950/80 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          LIVE FEED LOG
        </div>
        <div className="p-4 space-y-1.5 text-[11px] text-zinc-500 bg-zinc-950/10 min-h-[120px]">
          {logs.map((log, idx) => (
            <div key={idx} className={`leading-relaxed whitespace-pre-wrap ${idx === logs.length - 1 ? 'text-zinc-400 font-medium' : ''}`}>
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
