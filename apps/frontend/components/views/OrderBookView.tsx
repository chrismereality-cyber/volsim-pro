'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Layers,
  Activity,
  Percent,
} from 'lucide-react';
import { useTradingStore, type MarketQuote } from '../../store/useTradingStore';

interface BookLevel {
  price: number;
  size: number;
  total: number;
}

const MARKET_NAMES: Record<string, string> = {
  XAUUSDm: 'Gold Spot (m)',
  EURUSD: 'Euro / US Dollar',
  GBPUSD: 'British Pound / US Dollar',
};

const MARKET_ORDER = ['XAUUSDm', 'EURUSD', 'GBPUSD'];

export default function OrderBookView() {
  const market = useTradingStore((state) => state.market);
  const isFastApiConnected = useTradingStore(
    (state) => state.isFastApiConnected
  );

  const availableSymbols = useMemo(() => {
    const symbols = Object.keys(market);

    return [
      ...MARKET_ORDER.filter((symbol) => symbols.includes(symbol)),
      ...symbols.filter((symbol) => !MARKET_ORDER.includes(symbol)),
    ];
  }, [market]);

  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSDm');

  const activeSymbol =
    availableSymbols.includes(selectedSymbol)
      ? selectedSymbol
      : availableSymbols[0] ?? '';

  const currentMarket: MarketQuote | null =
    activeSymbol && market[activeSymbol]
      ? market[activeSymbol]
      : null;

  const orderBookData = useMemo(() => {
    if (!currentMarket) {
      return {
        asks: [] as BookLevel[],
        bids: [] as BookLevel[],
        maxTotal: 1,
        midPrice: 0,
      };
    }

    const depthLevels = 8;
    const point = currentMarket.point || 0.001;
    const digits = Math.max(0, Math.trunc(currentMarket.digits));

    const bid = currentMarket.bid;
    const ask = currentMarket.ask;
    const midPrice = (bid + ask) / 2;

    /*
     * The current MT5 contract supplies top-of-book bid/ask,
     * but does not supply Level-2 depth quantities.
     *
     * Therefore the ladder below is PRICE-DERIVED only.
     * Size values are deterministic display depth, not broker liquidity.
     */
    const displaySize = (level: number, sideMultiplier: number) => {
      const base = 1 + level * 0.75;
      return Number((base * sideMultiplier).toFixed(2));
    };

    const asks: BookLevel[] = [];
    const bids: BookLevel[] = [];

    let askTotal = 0;
    let bidTotal = 0;

    for (let i = depthLevels - 1; i >= 0; i--) {
      const price = Number(
        (ask + i * point).toFixed(digits)
      );

      const size = displaySize(depthLevels - i, 1.0);
      askTotal += size;

      asks.push({
        price,
        size,
        total: Number(askTotal.toFixed(2)),
      });
    }

    for (let i = 0; i < depthLevels; i++) {
      const price = Number(
        (bid - i * point).toFixed(digits)
      );

      const size = displaySize(i + 1, 1.15);
      bidTotal += size;

      bids.push({
        price,
        size,
        total: Number(bidTotal.toFixed(2)),
      });
    }

    const maxTotal = Math.max(
      asks.length ? asks[asks.length - 1].total : 1,
      bids.length ? bids[bids.length - 1].total : 1
    );

    return {
      asks,
      bids,
      maxTotal,
      midPrice,
    };
  }, [currentMarket]);

  const spread = currentMarket?.spread ?? 0;
  const midPrice = orderBookData.midPrice;

  const decimals = currentMarket
    ? Math.max(0, Math.trunc(currentMarket.digits))
    : 2;

  return (
    <div className="space-y-4">

      {/* Order Book Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm font-mono text-xs tracking-wider gap-3">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isFastApiConnected && currentMarket
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            ></span>

            // LIQUIDITY ORDER BOOK LAYER HANDSHAKE ACTIVE...
          </div>

          <p className="text-zinc-500">
            MT5 top-of-book quote stream with price-derived depth ladder.
          </p>
        </div>

        <div className="flex items-center gap-2 border border-zinc-850 bg-zinc-900 rounded-sm p-1">
          <Layers className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />

          <select
            value={activeSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            disabled={availableSymbols.length === 0}
            className="bg-transparent text-zinc-200 border-none outline-none focus:ring-0 font-mono text-xs font-bold py-1 px-2 cursor-pointer uppercase disabled:cursor-not-allowed"
          >
            {availableSymbols.length > 0 ? (
              availableSymbols.map((symbol) => (
                <option
                  key={symbol}
                  value={symbol}
                  className="bg-zinc-950 text-zinc-200"
                >
                  {MARKET_NAMES[symbol] ?? 'MT5 Market'} ({symbol})
                </option>
              ))
            ) : (
              <option className="bg-zinc-950 text-zinc-500">
                Awaiting MT5 Market
              </option>
            )}
          </select>
        </div>
      </div>

      {!currentMarket ? (
        <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-10 text-center font-mono">
          <Activity className="w-5 h-5 text-zinc-600 mx-auto mb-3" />

          <div className="text-zinc-500 text-[10px] uppercase tracking-widest">
            Awaiting canonical MT5 market state...
          </div>

          <div className="text-zinc-700 text-[9px] mt-2">
            No executable bid/ask quote is currently available.
          </div>
        </div>
      ) : (
        <div className="border border-zinc-800 bg-zinc-950/20 rounded-sm overflow-hidden shadow-2xl font-mono text-xs">

          <div className="grid grid-cols-3 p-3 text-zinc-500 border-b border-zinc-900 bg-zinc-950 text-[10px] uppercase tracking-widest font-bold">
            <div>
              Price ({activeSymbol.includes('XAU') ? 'USD' : 'QUOTE'})
            </div>

            <div className="text-right">
              Display Size
            </div>

            <div className="text-right">
              Display Total
            </div>
          </div>

          <div className="px-3 py-1.5 border-b border-zinc-900 bg-zinc-950/70 text-[9px] text-zinc-600 uppercase tracking-widest">
            Depth quantities are display-derived until a genuine MT5 Level-2 feed is connected.
          </div>

          {/* ASK SIDE */}
          <div className="divide-y divide-zinc-900/40">
            {orderBookData.asks.map((ask, idx) => {
              const sizePercent = Math.min(
                100,
                (ask.total / orderBookData.maxTotal) * 100
              );

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
                    {ask.price.toLocaleString(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })}
                  </div>

                  <div className="text-right text-zinc-300 font-semibold z-10">
                    {ask.size.toFixed(2)}
                  </div>

                  <div className="text-right text-zinc-500 z-10">
                    {ask.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* LIVE MID / SPREAD */}
          <div className="grid grid-cols-3 px-3 py-3 border-y border-zinc-900 bg-zinc-950 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-zinc-100 font-bold">
                {midPrice.toLocaleString(undefined, {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })}
              </span>

              <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            </div>

            <div className="col-span-2 text-right flex items-center justify-end gap-3 text-[10px] text-zinc-400 font-semibold">
              <span className="flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-zinc-600" />

                SPREAD:

                <span className="text-zinc-200 font-bold">
                  {spread.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  })}
                </span>
              </span>

              <span className="h-3 w-[1px] bg-zinc-800"></span>

              <span className="flex items-center gap-1 text-[9.5px]">
                <Percent className="w-2.5 h-2.5 text-zinc-600" />

                SPREAD %:

                <span className="text-zinc-400 font-bold">
                  {midPrice > 0
                    ? ((spread / midPrice) * 100).toFixed(4)
                    : '0.0000'}
                  %
                </span>
              </span>
            </div>
          </div>

          {/* BID SIDE */}
          <div className="divide-y divide-zinc-900/40">
            {orderBookData.bids.map((bid, idx) => {
              const sizePercent = Math.min(
                100,
                (bid.total / orderBookData.maxTotal) * 100
              );

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
                    {bid.price.toLocaleString(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })}
                  </div>

                  <div className="text-right text-zinc-300 font-semibold z-10">
                    {bid.size.toFixed(2)}
                  </div>

                  <div className="text-right text-zinc-500 z-10">
                    {bid.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
