'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Radio, Terminal } from 'lucide-react';
import { useTradingStore, type MarketQuote } from '../../store/useTradingStore';

const MARKET_ORDER = ['XAUUSDm', 'EURUSD', 'GBPUSD'];

const MARKET_NAMES: Record<string, string> = {
  XAUUSDm: 'Gold Spot (m)',
  EURUSD: 'Euro / US Dollar',
  GBPUSD: 'British Pound / US Dollar',
};

export default function MarketOverviewView() {
  const market = useTradingStore((state) => state.market);
  const isFastApiConnected = useTradingStore(
    (state) => state.isFastApiConnected
  );

  const [currentTimeStr, setCurrentTimeStr] = useState<string>('--:--:--');

  useEffect(() => {
    const updateClock = () => {
      setCurrentTimeStr(new Date().toTimeString().split(' ')[0]);
    };

    updateClock();

    const clockInterval = setInterval(updateClock, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  const markets: MarketQuote[] = MARKET_ORDER
    .map((symbol) => market[symbol])
    .filter((quote): quote is MarketQuote => Boolean(quote));

  const connectionStatus =
    isFastApiConnected && markets.length > 0 ? 'RUNNING' : 'WAITING';

  return (
    <div className="space-y-6 font-mono text-xs">

      {/* Top Router Gateway Status Stream Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-zinc-800 bg-zinc-950/40 p-4 rounded-sm tracking-wider gap-3">
        <div className="space-y-1">
          <div className="text-emerald-400 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'RUNNING'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            ></span>
            // MARKET OVERVIEW CONTROL STREAM ACTIVE...
          </div>
          <p className="text-zinc-500">
            Canonical MT5 market quotes received through the centralized trading-state stream.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-zinc-900 border border-zinc-850 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          BRIDGE:{' '}
          <span
            className={
              connectionStatus === 'RUNNING'
                ? 'text-emerald-400'
                : 'text-zinc-500'
            }
          >
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Grid Cluster Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {markets.map((quote) => {
          const decimals = Math.max(0, Math.trunc(quote.digits));
          const spreadValue = quote.spread;

          return (
            <div
              key={quote.symbol}
              className="border border-zinc-800 bg-zinc-950/20 rounded-sm p-4 space-y-4 shadow-xl"
            >

              {/* Card Meta Row */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-zinc-200 font-bold text-[13px] tracking-wide">
                    {quote.symbol}
                  </h3>

                  <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">
                    {MARKET_NAMES[quote.symbol] ?? 'MT5 MARKET'}
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-sm font-bold text-[10px] border border-emerald-950 bg-emerald-950/30 text-emerald-400">
                  <Radio className="w-3 h-3" />
                  LIVE
                </div>
              </div>

              {/* Core Liquidity Bid / Ask Spread Boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-zinc-850 bg-zinc-900/40 p-2.5 rounded-sm relative">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">
                    BID
                  </div>

                  <div className="text-zinc-100 font-bold text-[14px]">
                    {quote.bid.toLocaleString(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })}
                  </div>
                </div>

                <div className="border border-zinc-850 bg-zinc-900/40 p-2.5 rounded-sm relative">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">
                    ASK
                  </div>

                  <div className="text-zinc-100 font-bold text-[14px]">
                    {quote.ask.toLocaleString(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Bottom Metric Row */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[10px] font-semibold text-zinc-500">
                <div className="flex items-center gap-1.5">
                  SPREAD:{' '}
                  <span className="text-zinc-300 font-bold">
                    {spreadValue.toFixed(decimals)}
                  </span>
                </div>

                <div className="text-zinc-600 flex items-center gap-1">
                  LAST:{' '}
                  <span className="text-zinc-400 font-bold">
                    {quote.last.toLocaleString(undefined, {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                    })}
                  </span>
                </div>
              </div>

            </div>
          );
        })}

        {markets.length === 0 && (
          <div className="md:col-span-3 border border-zinc-800 bg-zinc-950/30 rounded-sm p-8 text-center">
            <Activity className="w-5 h-5 text-zinc-600 mx-auto mb-3" />

            <div className="text-zinc-500 text-[10px] uppercase tracking-widest">
              Awaiting canonical MT5 market state...
            </div>

            <div className="text-zinc-700 text-[9px] mt-2">
              No market quotes are currently available in the centralized trading-state store.
            </div>
          </div>
        )}
      </div>

      {/* Live Feed Terminal Log Display */}
      <div className="border border-zinc-800 bg-zinc-950/40 rounded-sm overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-900 bg-zinc-950/80 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          LIVE FEED LOG
        </div>

        <div className="p-4 space-y-1.5 text-[11px] text-zinc-500 bg-zinc-950/10 min-h-[120px]">
          <div className="leading-relaxed text-zinc-400 font-medium">
            [{currentTimeStr}] Centralized trading-state stream active.
          </div>

          {markets.map((quote) => (
            <div
              key={quote.symbol}
              className="leading-relaxed whitespace-pre-wrap"
            >
              [{currentTimeStr}] MT5 quote synchronized: {quote.symbol} | BID{' '}
              {quote.bid.toFixed(Math.max(0, Math.trunc(quote.digits)))} | ASK{' '}
              {quote.ask.toFixed(Math.max(0, Math.trunc(quote.digits)))}
            </div>
          ))}

          {markets.length === 0 && (
            <div className="leading-relaxed text-zinc-600">
              [{currentTimeStr}] Awaiting market-state payload...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
