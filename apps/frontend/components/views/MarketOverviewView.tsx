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

  const isRunning = connectionStatus === 'RUNNING';

  return (
    <div className="telemetry-shell space-y-6 p-1 font-mono">

      {/* MARKET STREAM HEADER */}
      <div className="telemetry-card p-5 md:p-6">

        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <Activity className="h-6 w-6 text-emerald-400" />

              <h1 className="text-2xl font-black tracking-[0.12em] text-white md:text-3xl">
                MARKET OVERVIEW
              </h1>

            </div>

            <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Canonical MT5 market quotes • centralized trading-state stream
            </p>
          </div>

          <div
            className={
              isRunning
                ? 'telemetry-status telemetry-status-online'
                : 'telemetry-status telemetry-status-warning'
            }
          >
            <span className="mr-2">●</span>
            BRIDGE: {connectionStatus}
          </div>

        </div>

        <div className="mt-5 border-t border-zinc-900 pt-4">

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] font-bold uppercase tracking-[0.16em]">

            <div className="flex items-center gap-2 text-zinc-500">
              <span
                className={`h-2 w-2 rounded-full ${
                  isRunning
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-zinc-600'
                }`}
              />
              MARKET CONTROL STREAM
            </div>

            <div className="text-zinc-600">
              QUOTES: <span className="text-zinc-300">{markets.length}</span>
            </div>

            <div className="text-zinc-600">
              CLOCK: <span className="text-zinc-300">{currentTimeStr}</span>
            </div>

          </div>

        </div>

      </div>

      {/* MARKET QUOTE MATRIX */}
      <section>

        <h2 className="telemetry-section">
          LIVE MARKET QUOTE MATRIX
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          {markets.map((quote) => {

            const decimals = Math.max(
              0,
              Math.trunc(quote.digits)
            );

            const spreadValue = quote.spread;

            const bid = quote.bid.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });

            const ask = quote.ask.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });

            const last = quote.last.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });

            return (
              <div
                key={quote.symbol}
                className="telemetry-card p-5"
              >

                {/* SYMBOL HEADER */}
                <div className="mb-5 flex items-start justify-between border-b border-zinc-900 pb-4">

                  <div>
                    <div className="text-xl font-black tracking-[0.14em] text-white">
                      {quote.symbol}
                    </div>

                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                      {MARKET_NAMES[quote.symbol] ?? 'MT5 MARKET'}
                    </div>
                  </div>

                  <div className="telemetry-status telemetry-status-online">
                    <Radio className="mr-1.5 h-3.5 w-3.5" />
                    LIVE
                  </div>

                </div>

                {/* BID / ASK */}
                <div className="grid grid-cols-2 gap-3">

                  <div className="rounded border border-zinc-900 bg-black/20 p-4">

                    <div className="telemetry-label">
                      BID
                    </div>

                    <div className="mt-2 text-xl font-black tracking-tight text-white md:text-2xl">
                      {bid}
                    </div>

                  </div>

                  <div className="rounded border border-zinc-900 bg-black/20 p-4">

                    <div className="telemetry-label">
                      ASK
                    </div>

                    <div className="mt-2 text-xl font-black tracking-tight text-white md:text-2xl">
                      {ask}
                    </div>

                  </div>

                </div>

                {/* SECONDARY MARKET TELEMETRY */}
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">

                  <div>
                    <div className="telemetry-label">
                      SPREAD
                    </div>

                    <div className="mt-1 text-base font-black text-zinc-200">
                      {spreadValue.toFixed(decimals)}
                    </div>
                  </div>

                  <div>
                    <div className="telemetry-label">
                      LAST
                    </div>

                    <div className="mt-1 text-base font-black text-zinc-200">
                      {last}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}

          {markets.length === 0 && (
            <div className="telemetry-card md:col-span-3 p-10 text-center">

              <Activity className="mx-auto mb-4 h-7 w-7 text-zinc-600" />

              <div className="telemetry-label">
                AWAITING CANONICAL MT5 MARKET STATE
              </div>

              <div className="mt-2 text-xs font-semibold text-zinc-600">
                No market quotes are currently available in the centralized trading-state store.
              </div>

            </div>
          )}

        </div>

      </section>

      {/* LIVE FEED */}
      <section>

        <h2 className="telemetry-section">
          MARKET STREAM TELEMETRY
        </h2>

        <div className="telemetry-card overflow-hidden">

          <div className="flex items-center gap-3 border-b border-zinc-900 px-5 py-4">

            <Terminal className="h-5 w-5 text-emerald-400" />

            <div>
              <div className="text-sm font-black tracking-[0.14em] text-white">
                LIVE FEED LOG
              </div>

              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                CENTRALIZED TRADING-STATE TELEMETRY
              </div>
            </div>

          </div>

          <div className="min-h-[140px] space-y-2 bg-black/10 p-5 text-xs">

            <div className="font-bold leading-relaxed text-zinc-300">
              <span className="text-zinc-600">
                [{currentTimeStr}]
              </span>{' '}
              Centralized trading-state stream active.
            </div>

            {markets.map((quote) => {

              const decimals = Math.max(
                0,
                Math.trunc(quote.digits)
              );

              return (
                <div
                  key={quote.symbol}
                  className="leading-relaxed text-zinc-500"
                >
                  <span className="text-zinc-700">
                    [{currentTimeStr}]
                  </span>{' '}
                  MT5 quote synchronized:{' '}
                  <span className="font-black text-zinc-300">
                    {quote.symbol}
                  </span>{' '}
                  | BID{' '}
                  <span className="font-bold text-zinc-400">
                    {quote.bid.toFixed(decimals)}
                  </span>{' '}
                  | ASK{' '}
                  <span className="font-bold text-zinc-400">
                    {quote.ask.toFixed(decimals)}
                  </span>
                </div>
              );
            })}

            {markets.length === 0 && (
              <div className="leading-relaxed text-zinc-600">
                [{currentTimeStr}] Awaiting market-state payload...
              </div>
            )}

          </div>

        </div>

      </section>

    </div>
  );
}
