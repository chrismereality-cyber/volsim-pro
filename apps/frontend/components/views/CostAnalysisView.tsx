'use client';

import React from 'react';
import { DollarSign, Percent, Zap, Layers, Gauge } from 'lucide-react';

export default function CostAnalysisView() {
  return (
    <div className="telemetry-shell space-y-6">

      <header className="border-b border-zinc-800 pb-5">

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

          <div>
            <div className="telemetry-sublabel">
              EXECUTION / FRICTION INTELLIGENCE
            </div>

            <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-white uppercase">
              Transaction Cost Analysis
            </h1>

            <p className="mt-2 text-sm font-medium text-zinc-400">
              Spread variance, execution friction, latency drag, and transaction-cost reference telemetry.
            </p>
          </div>

          <div className="telemetry-status telemetry-status-neutral">
            <Gauge className="mr-2 h-3.5 w-3.5" />
            MODEL REFERENCE: 1.14 BPS
          </div>

        </div>

      </header>

      <section>

        <div className="telemetry-section">
          EXECUTION FRICTION TELEMETRY
        </div>

        <div className="telemetry-grid mt-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

          <div className="telemetry-card">

            <div className="telemetry-label flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              SPREAD EXPENSE
            </div>

            <div className="telemetry-value-lg mt-3 text-white">
              $14.02
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              Base bid-ask crossing cost reference
            </div>

          </div>

          <div className="telemetry-card">

            <div className="telemetry-label flex items-center gap-2">
              <Percent className="h-4 w-4 text-emerald-400" />
              COMMISSIONS
            </div>

            <div className="telemetry-value-lg mt-3 telemetry-positive">
              $0.00
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              Raw-spread framework reference
            </div>

          </div>

          <div className="telemetry-card">

            <div className="telemetry-label flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              EXECUTION SLIPPAGE
            </div>

            <div className="telemetry-value-lg mt-3 text-amber-400">
              +0.12 Pips
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              Latency degradation reference
            </div>

          </div>

          <div className="telemetry-card">

            <div className="telemetry-label flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-violet-400" />
              SWAP COST DRAG
            </div>

            <div className="telemetry-value-lg mt-3 text-zinc-300">
              -$2.10
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              Overnight premium-decay reference
            </div>

          </div>

        </div>

      </section>

      <section>

        <div className="telemetry-section">
          ASSET FRICTION MATRIX
        </div>

        <p className="mt-1 text-xs text-zinc-500">
          Reference execution-cost profile across configured instruments.
        </p>

        <div className="telemetry-card mt-3 overflow-hidden p-0">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[760px] text-left">

              <thead>

                <tr className="border-b border-zinc-800 bg-zinc-950/80">

                  <th className="telemetry-label px-4 py-4">
                    ASSET
                  </th>

                  <th className="telemetry-label px-4 py-4">
                    AVG SPREAD
                  </th>

                  <th className="telemetry-label px-4 py-4 text-right">
                    EXECUTION LATENCY
                  </th>

                  <th className="telemetry-label px-4 py-4 text-right">
                    TOTAL DRAG
                  </th>

                  <th className="telemetry-label px-4 py-4 text-right">
                    COST STATE
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-zinc-900">

                <tr className="transition-colors hover:bg-zinc-900/40">

                  <td className="px-4 py-5">
                    <div className="text-base font-black tracking-wide text-white">
                      XAUUSDm
                    </div>

                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Gold / MT5 target
                    </div>
                  </td>

                  <td className="px-4 py-5">
                    <div className="text-sm font-bold text-zinc-200">
                      1.2 Pips
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <div className="text-sm font-black text-emerald-400">
                      14.2 ms
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <div className="text-base font-black text-sky-400">
                      $13.50
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <span className="telemetry-status telemetry-status-online">
                      LOW DRAG
                    </span>
                  </td>

                </tr>

                <tr className="transition-colors hover:bg-zinc-900/40">

                  <td className="px-4 py-5">
                    <div className="text-base font-black tracking-wide text-white">
                      BTCUSDm
                    </div>

                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Bitcoin / MT5 target
                    </div>
                  </td>

                  <td className="px-4 py-5">
                    <div className="text-sm font-bold text-zinc-200">
                      18.4 Pips
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <div className="text-sm font-black text-amber-400">
                      78.6 ms
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <div className="text-base font-black text-sky-400">
                      $18.00
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <span className="telemetry-status telemetry-status-warning">
                      ELEVATED DRAG
                    </span>
                  </td>

                </tr>

                <tr className="transition-colors hover:bg-zinc-900/40">

                  <td className="px-4 py-5">
                    <div className="text-base font-black tracking-wide text-white">
                      Volatility_100
                    </div>

                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      Synthetic index
                    </div>
                  </td>

                  <td className="px-4 py-5">
                    <div className="text-sm font-bold text-zinc-200">
                      0.50 Pips
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <div className="text-sm font-black text-emerald-400">
                      15.0 ms
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <div className="text-base font-black text-sky-400">
                      $0.52
                    </div>
                  </td>

                  <td className="px-4 py-5 text-right">
                    <span className="telemetry-status telemetry-status-online">
                      LOW DRAG
                    </span>
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

      </section>

      <section>

        <div className="telemetry-section">
          COST MODEL CONTEXT
        </div>

        <div className="telemetry-card mt-3">

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

            <div>
              <div className="telemetry-label">
                ANALYSIS TYPE
              </div>

              <div className="telemetry-value-md mt-2">
                TCA REFERENCE
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                DATA STATE
              </div>

              <div className="telemetry-value-md mt-2">
                STATIC MODEL
              </div>
            </div>

            <div>
              <div className="telemetry-label">
                EXECUTION SCOPE
              </div>

              <div className="telemetry-value-md mt-2">
                MULTI-ASSET
              </div>
            </div>

          </div>

          <div className="telemetry-divider my-5" />

          <p className="text-xs leading-5 text-zinc-500">
            Current transaction-cost values are configured reference data
            presented by the existing panel. They are not claimed as
            live broker-measured execution costs until connected telemetry
            provides spread, commission, slippage, latency, and swap
            observations.
          </p>

        </div>

      </section>

    </div>
  );
}
