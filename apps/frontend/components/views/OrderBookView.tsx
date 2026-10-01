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

  const connected = Boolean(isFastApiConnected && currentMarket);

  const formatPrice = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <div className="telemetry-shell space-y-5">

      {/* HEADER / CONNECTION STATE */}
      <div className="telemetry-card overflow-hidden">
        <div className="p-4 md:p-5">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-5 h-5 text-emerald-400" />

                <span className="telemetry-label">
                  EXECUTION MARKET DATA
                </span>

                <span
                  className={`w-2 h-2 rounded-full ${
                    connected
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-zinc-600'
                  }`}
                />
              </div>

              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
                ORDER BOOK
              </h2>

              <p className="mt-1 text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.16em]">
                MT5 top-of-book execution ladder
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">

              <div className="telemetry-card px-4 py-3 min-w-[150px]">
                <div className="telemetry-label">
                  STREAM
                </div>

                <div
                  className={`mt-1 text-sm font-black uppercase tracking-wider ${
                    connected
                      ? 'text-emerald-400'
                      : 'text-zinc-500'
                  }`}
                >
                  {connected ? 'LIVE' : 'WAITING'}
                </div>
              </div>

              <div className="telemetry-card px-4 py-2">
                <div className="telemetry-label mb-1">
                  ACTIVE MARKET
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />

                  <select
                    value={activeSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value)}
                    disabled={availableSymbols.length === 0}
                    className="bg-transparent text-white border-none outline-none focus:ring-0 font-mono text-sm font-black uppercase cursor-pointer disabled:cursor-not-allowed"
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

            </div>
          </div>
        </div>

        <div className="telemetry-divider" />

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-zinc-800/70">

          <div className="px-4 py-3">
            <div className="telemetry-label">BID</div>
            <div className="telemetry-value-lg text-emerald-400 mt-1">
              {currentMarket ? formatPrice(currentMarket.bid) : '--'}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="telemetry-label">ASK</div>
            <div className="telemetry-value-lg text-rose-400 mt-1">
              {currentMarket ? formatPrice(currentMarket.ask) : '--'}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="telemetry-label">SPREAD</div>
            <div className="telemetry-value-lg text-white mt-1">
              {currentMarket ? formatPrice(spread) : '--'}
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="telemetry-label">MID PRICE</div>
            <div className="telemetry-value-lg text-white mt-1">
              {currentMarket ? formatPrice(midPrice) : '--'}
            </div>
          </div>

        </div>
      </div>

      {!currentMarket ? (
        <div className="telemetry-card p-12 text-center font-mono">
          <Activity className="w-6 h-6 text-zinc-600 mx-auto mb-4" />

          <div className="telemetry-label">
            AWAITING CANONICAL MT5 MARKET STATE
          </div>

          <div className="text-[10px] text-zinc-700 mt-2 uppercase tracking-widest">
            No executable bid/ask quote is currently available.
          </div>
        </div>
      ) : (
        <div className="telemetry-card overflow-hidden font-mono">

          {/* BOOK TITLE */}
          <div className="px-4 py-4 border-b border-zinc-800/80 bg-zinc-950/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

              <div>
                <div className="telemetry-section">
                  LIVE PRICE LADDER
                </div>

                <div className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">
                  {MARKET_NAMES[activeSymbol] ?? 'MT5 Market'}
                </div>
              </div>

              <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
                Execution terminal view
              </div>

            </div>
          </div>

          {/* DATA DISCLAIMER */}
          <div className="px-4 py-2.5 border-b border-zinc-900 bg-amber-950/10">
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] text-amber-500/80 uppercase tracking-widest">
              <Activity className="w-3 h-3 shrink-0" />
              Display depth is price-derived until a genuine MT5 Level-2 feed is connected.
            </div>
          </div>

          {/* COLUMN HEADERS */}
          <div className="grid grid-cols-3 px-4 py-2.5 bg-zinc-950 border-b border-zinc-900 text-[9px] uppercase tracking-[0.16em] font-black text-zinc-600">
            <div>Price</div>
            <div className="text-right">Size</div>
            <div className="text-right">Cumulative</div>
          </div>

          {/* ASK LABEL */}
          <div className="flex items-center justify-between px-4 py-2 bg-rose-950/10 border-b border-rose-950/20">
            <span className="text-[10px] font-black tracking-[0.2em] text-rose-400">
              ASK / OFFER
            </span>

            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
              SELL SIDE
            </span>
          </div>

          {/* ASK SIDE */}
          <div className="divide-y divide-zinc-900/50">
            {orderBookData.asks.map((ask, idx) => {
              const sizePercent = Math.min(
                100,
                (ask.total / orderBookData.maxTotal) * 100
              );

              return (
                <div
                  key={`ask-${idx}-${ask.price}`}
                  className="grid grid-cols-3 px-4 py-2.5 relative hover:bg-rose-950/10 transition-colors items-center"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-950/20 border-r-2 border-rose-500/20 pointer-events-none transition-all duration-300"
                    style={{ width: `${sizePercent}%` }}
                  />

                  <div className="text-rose-400 font-black text-sm md:text-base z-10">
                    {formatPrice(ask.price)}
                  </div>

                  <div className="text-right text-zinc-200 font-bold text-sm z-10">
                    {ask.size.toFixed(2)}
                  </div>

                  <div className="text-right text-zinc-500 text-xs z-10">
                    {ask.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MID / SPREAD CORE */}
          <div className="border-y border-zinc-700/60 bg-zinc-900/40">

            <div className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

              <div className="flex items-center gap-3">
                <div>
                  <div className="telemetry-label">
                    LIVE MID
                  </div>

                  <div className="text-xl md:text-2xl font-black text-white tracking-tight">
                    {formatPrice(midPrice)}
                  </div>
                </div>

                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>

              <div className="flex items-center gap-4 text-[10px] uppercase tracking-wider">

                <div>
                  <div className="text-zinc-600">Spread</div>
                  <div className="text-white font-black text-sm">
                    {formatPrice(spread)}
                  </div>
                </div>

                <div className="h-8 w-px bg-zinc-800" />

                <div>
                  <div className="text-zinc-600 flex items-center gap-1">
                    <Percent className="w-2.5 h-2.5" />
                    Spread %
                  </div>

                  <div className="text-zinc-300 font-black text-sm">
                    {midPrice > 0
                      ? ((spread / midPrice) * 100).toFixed(4)
                      : '0.0000'}
                    %
                  </div>
                </div>

                <div className="h-8 w-px bg-zinc-800" />

                <div>
                  <div className="text-zinc-600">State</div>
                  <div className="text-emerald-400 font-black text-sm">
                    LIVE
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* BID LABEL */}
          <div className="flex items-center justify-between px-4 py-2 bg-emerald-950/10 border-b border-emerald-950/20">
            <span className="text-[10px] font-black tracking-[0.2em] text-emerald-400">
              BID / DEMAND
            </span>

            <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
              BUY SIDE
            </span>
          </div>

          {/* BID SIDE */}
          <div className="divide-y divide-zinc-900/50">
            {orderBookData.bids.map((bid, idx) => {
              const sizePercent = Math.min(
                100,
                (bid.total / orderBookData.maxTotal) * 100
              );

              return (
                <div
                  key={`bid-${idx}-${bid.price}`}
                  className="grid grid-cols-3 px-4 py-2.5 relative hover:bg-emerald-950/10 transition-colors items-center"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-950/20 border-r-2 border-emerald-500/20 pointer-events-none transition-all duration-300"
                    style={{ width: `${sizePercent}%` }}
                  />

                  <div className="text-emerald-400 font-black text-sm md:text-base z-10">
                    {formatPrice(bid.price)}
                  </div>

                  <div className="text-right text-zinc-200 font-bold text-sm z-10">
                    {bid.size.toFixed(2)}
                  </div>

                  <div className="text-right text-zinc-500 text-xs z-10">
                    {bid.total.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* FOOTER STATE */}
          <div className="px-4 py-3 border-t border-zinc-900 bg-zinc-950/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
              Canonical source: MT5 market state
            </div>

            <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest">
              <span className="text-zinc-600">Feed</span>
              <span className={connected ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                {connected ? 'CONNECTED' : 'WAITING'}
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
