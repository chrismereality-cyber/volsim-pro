'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, TrendingUp, ArrowUpDown, Layers, Activity, Percent } from 'lucide-react';

interface MarketConfig {
  symbol: string;
  name: string;
  basePrice: number;
  decimals: number;
  spread: number;
  tickSize: number;
  volatility: number;
  volumeScale: number;
}

const SUPPORTED_MARKETS: MarketConfig[] = [
  {
    symbol: 'XAUUSDm',
    name: 'Gold Spot (m)',
    basePrice: 4165.50,
    decimals: 2,
    spread: 0.12,
    tickSize: 0.01,
    volatility: 0.25,
    volumeScale: 5.5
  },
  {
    symbol: '1HZ75V',
    name: 'Volatility 75 Index',
    basePrice: 172450.00,
    decimals: 2,
    spread: 4.80,
    tickSize: 0.05,
    volatility: 12.5,
    volumeScale: 0.45
  },
  {
    symbol: '1HZ100V',
    name: 'Volatility 100 Index',
    basePrice: 4181.44,
    decimals: 2,
    spread: 0.35,
    tickSize: 0.01,
    volatility: 0.45,
    volumeScale: 1.2
  }
];

interface BookLevel {
  price: number;
  size: number;
  total: number;
}

export default function OrderBookView() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(SUPPORTED_MARKETS[0].symbol);

  const currentMarket = useMemo(() => {
    return SUPPORTED_MARKETS.find(m => m.symbol === selectedSymbol) || SUPPORTED_MARKETS[0];
  }, [selectedSymbol]);

  const [midPrice, setMidPrice] = useState<number>(currentMarket.basePrice);
  const [spread, setSpread] = useState<number>(currentMarket.spread);

  useEffect(() => {
    setMidPrice(currentMarket.basePrice);
    setSpread(currentMarket.spread);
  }, [currentMarket]);

  useEffect(() => {
    const priceInterval = setInterval(() => {
      setMidPrice(prev => {
        const tickDrift = (Math.random() - 0.5) * currentMarket.volatility;
        const unrounded = prev + tickDrift;
        return Math.round(unrounded / currentMarket.tickSize) * currentMarket.tickSize;
      });

      setSpread(prev => {
        const spreadFluctuation = (Math.random() - 0.5) * (currentMarket.spread * 0.1);
        const nextSpread = prev + spreadFluctuation;
        return Math.max(currentMarket.tickSize * 2, parseFloat(nextSpread.toFixed(2)));
      });
    }, 450);

    return () => clearInterval(priceInterval);
  }, [currentMarket]);

  const orderBookData = useMemo(() => {
    const depthLevels = 8;
    const tickSize = currentMarket.tickSize;
    const halfSpread = spread / 2;

    const askPrices: number[] = [];
    const bidPrices: number[] = [];

    for (let i = 1; i <= depthLevels; i++) {
      const askPrice = midPrice + halfSpread + (i - 1) * tickSize;
      const bidPrice = midPrice - halfSpread - (i - 1) * tickSize;

      askPrices.push(parseFloat(askPrice.toFixed(currentMarket.decimals)));
      bidPrices.push(parseFloat(bidPrice.toFixed(currentMarket.decimals)));
    }

    askPrices.reverse();

    const generateSize = (index: number) => {
      const base = Math.random() * currentMarket.volumeScale;
      const depthMultiplier = 1 + (index * 0.25);
      return parseFloat((base * depthMultiplier).toFixed(2));
    };

    let askAccumulator = 0;
    const asks: BookLevel[] = askPrices.map((price, idx) => {
      const size = generateSize(depthLevels - idx);
      askAccumulator += size;
      return { price, size, total: parseFloat(askAccumulator.toFixed(2)) };
    });
    asks.reverse();

    let askRunningTotal = 0;
    const sortedAsks = [...asks].reverse().map(item => {
      askRunningTotal += item.size;
      return { ...item, total: parseFloat(askRunningTotal.toFixed(2)) };
    }).reverse();

    let bidAccumulator = 0;
    const bids: BookLevel[] = bidPrices.map((price, idx) => {
      const size = generateSize(idx + 1);
      bidAccumulator += size;
      return { price, size, total: parseFloat(bidAccumulator.toFixed(2)) };
    });

    const maxTotal = Math.max(
      sortedAsks.length > 0 ? sortedAsks[0].total : 1,
      bids.length > 0 ? bids[bids.length - 1].total : 1
    );

    return { asks: sortedAsks, bids, maxTotal };
  }, [midPrice, spread, currentMarket]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm font-mono text-xs tracking-wider gap-3">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            // LIQUIDITY ORDER BOOK LAYER HANDSHAKE ACTIVE...
          </div>
          <p className="text-zinc-500">Real-time composite bridge cross-matching matrix engine.</p>
        </div>

        <div className="flex items-center gap-2 border border-zinc-850 bg-zinc-900 rounded-sm p-1">
          <Layers className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-transparent text-zinc-200 border-none outline-none focus:ring-0 font-mono text-xs font-bold py-1 px-2 cursor-pointer uppercase"
          >
            {SUPPORTED_MARKETS.map(market => (
              <option key={market.symbol} value={market.symbol} className="bg-zinc-950 text-zinc-200">
                {market.name} ({market.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm overflow-hidden shadow-2xl font-mono text-xs">
        <div className="grid grid-cols-3 p-3 text-zinc-500 border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-widest font-bold">
          <div>Price ({selectedSymbol.includes('XAU') ? 'USD' : 'PTS'})</div>
          <div className="text-right">Size</div>
          <div className="text-right">Total Size</div>
        </div>

        <div className="divide-y divide-zinc-900/40">
          {orderBookData.asks.map((ask, idx) => {
            const sizePercent = Math.min(100, (ask.total / orderBookData.maxTotal) * 100);
            return (
              <div
                key={`ask-${idx}-${ask.price}`}
                className="grid grid-cols-3 px-3 py-1.5 relative hover:bg-zinc-900/10 transition-colors items-center"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-950/15 border-r-2 border-rose-500/10 pointer-events-none transition-all duration-300"
                  style={{ width: `${sizePercent}%` }}
                />
                <div className="text-rose-500 font-bold z-10">
                  {ask.price.toLocaleString(undefined, { minimumFractionDigits: currentMarket.decimals })}
                </div>
                <div className="text-right text-zinc-300 font-semibold z-10">
                  {ask.size.toFixed(2)}
                </div>
                <div className="text-right text-zinc-500 z-10">
                  {ask.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 px-3 py-3 border-y border-zinc-900 bg-zinc-950 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-zinc-100 font-bold">
              {midPrice.toLocaleString(undefined, { minimumFractionDigits: currentMarket.decimals })}
            </span>
            <Activity className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
          </div>
          <div className="col-span-2 text-right flex items-center justify-end gap-3 text-[10px] text-zinc-400 font-semibold">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-zinc-600" /> SPREAD:
              <span className="text-zinc-200 font-bold">{spread.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </span>
            <span className="h-3 w-[1px] bg-zinc-800"></span>
            <span className="flex items-center gap-1 text-[9.5px]">
              <Percent className="w-2.5 h-2.5 text-zinc-600" /> SPREAD %:
              <span className="text-zinc-400 font-bold">
                {((spread / midPrice) * 100).toFixed(4)}%
              </span>
            </span>
          </div>
        </div>

        <div className="divide-y divide-zinc-900/40">
          {orderBookData.bids.map((bid, idx) => {
            const sizePercent = Math.min(100, (bid.total / orderBookData.maxTotal) * 100);
            return (
              <div
                key={`bid-${idx}-${bid.price}`}
                className="grid grid-cols-3 px-3 py-1.5 relative hover:bg-zinc-900/10 transition-colors items-center"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-950/15 border-r-2 border-emerald-500/10 pointer-events-none transition-all duration-300"
                  style={{ width: `${sizePercent}%` }}
                />
                <div className="text-emerald-500 font-bold z-10">
                  {bid.price.toLocaleString(undefined, { minimumFractionDigits: currentMarket.decimals })}
                </div>
                <div className="text-right text-zinc-300 font-semibold z-10">
                  {bid.size.toFixed(2)}
                </div>
                <div className="text-right text-zinc-500 z-10">
                  {bid.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
