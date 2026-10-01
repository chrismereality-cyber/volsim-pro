"use client";

import React, { useMemo, useState } from "react";
import {
  Radio,
  Square,
  Activity,
  WalletCards,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useTradingStore } from "../../store/useTradingStore";

interface Position {
  ticket: string | number;
  symbol: string;
  type: string;
  volume: number;
  openPrice?: number;
  currentPrice?: number;
  profit?: number;
}

export default function LivePositionsView() {
  const positions =
    useTradingStore((state: any) => state.positions) ?? [];

  const connected =
    useTradingStore((state: any) => state.isFastApiConnected);

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const totalFloating = useMemo(
    () =>
      positions.reduce(
        (sum: number, p: Position) => sum + (p.profit ?? 0),
        0
      ),
    [positions]
  );

  const handleLiquidate = async (ticket: string | number) => {
    console.warn(
      "Liquidation endpoint not yet migrated.",
      ticket
    );

    setActionLoading(String(ticket));

    setTimeout(() => {
      setActionLoading(null);
    }, 500);
  };

  const formatPrice = (value?: number) =>
    (value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 5,
    });

  const formatMoney = (value?: number) =>
    `$${(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const floatingTone =
    totalFloating > 0
      ? "telemetry-positive"
      : totalFloating < 0
        ? "telemetry-negative"
        : "text-zinc-300";

  return (
    <div className="telemetry-shell space-y-5 p-1">

      {/* EXECUTION STATE HEADER */}
      <div className="telemetry-card overflow-hidden">

        <div className="p-5 md:p-6">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Radio
                  className={
                    connected
                      ? "w-5 h-5 text-emerald-400 animate-pulse"
                      : "w-5 h-5 text-rose-400"
                  }
                />

                <span className="telemetry-label">
                  EXECUTION / POSITION STATE
                </span>

                <span
                  className={`w-2 h-2 rounded-full ${
                    connected
                      ? "bg-emerald-400 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-[0.08em] text-white uppercase">
                LIVE POSITIONS
              </h1>

              <p className="mt-2 text-[10px] md:text-xs text-zinc-500 uppercase tracking-[0.16em]">
                Canonical broker position inventory
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="telemetry-card px-5 py-4 min-w-[150px]">
                <div className="telemetry-label">
                  ACTIVE POSITIONS
                </div>

                <div className="telemetry-value-lg text-white mt-1">
                  {positions.length}
                </div>
              </div>

              <div className="telemetry-card px-5 py-4 min-w-[180px]">
                <div className="telemetry-label">
                  FLOATING P/L
                </div>

                <div className={`telemetry-value-lg mt-1 ${floatingTone}`}>
                  {formatMoney(totalFloating)}
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="telemetry-divider" />

        <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />

            <span className="telemetry-label">
              BROKER STATE
            </span>

            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                connected
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {connected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>

          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
            Unified global trading state
          </div>

        </div>
      </div>

      {/* POSITION MATRIX */}
      <div className="telemetry-card overflow-hidden">

        <div className="px-5 py-4 border-b border-white/10 bg-black/20">

          <div className="flex items-center justify-between gap-3">

            <div>
              <div className="telemetry-section flex items-center gap-2">
                <WalletCards className="w-4 h-4 text-cyan-400" />
                POSITION MATRIX
              </div>

              <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">
                Live broker position inventory
              </div>
            </div>

            <div className="telemetry-status telemetry-status-neutral">
              {positions.length} RECORDS
            </div>

          </div>
        </div>

        {positions.length === 0 ? (

          <div className="p-16 text-center">

            <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-4" />

            <div className="telemetry-value-md text-zinc-500">
              NO ACTIVE POSITIONS
            </div>

            <div className="text-[10px] text-zinc-700 uppercase tracking-widest mt-2">
              Awaiting canonical broker position state
            </div>

          </div>

        ) : (

          <>
            {/* DESKTOP */}
            <div className="hidden lg:block overflow-x-auto">

              <table className="w-full text-left font-mono">

                <thead>
                  <tr className="border-b border-white/10 bg-black/30 text-[9px] uppercase tracking-[0.16em] text-zinc-600">

                    <th className="px-5 py-3 font-black">Ticket</th>
                    <th className="px-5 py-3 font-black">Instrument</th>
                    <th className="px-5 py-3 font-black">Direction</th>
                    <th className="px-5 py-3 text-right font-black">Volume</th>
                    <th className="px-5 py-3 text-right font-black">Open</th>
                    <th className="px-5 py-3 text-right font-black">Current</th>
                    <th className="px-5 py-3 text-right font-black">Floating P/L</th>
                    <th className="px-5 py-3 text-right font-black">Action</th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">

                  {positions.map((pos: Position) => {

                    const profit = pos.profit ?? 0;

                    const positionType =
                      String(pos.type ?? "").toLowerCase();

                    const isBuy =
                      positionType.includes("buy") ||
                      positionType === "long";

                    return (
                      <tr
                        key={String(pos.ticket)}
                        className="group hover:bg-white/[0.025] transition-colors"
                      >

                        <td className="px-5 py-4 text-zinc-600 text-xs">
                          #{pos.ticket}
                        </td>

                        <td className="px-5 py-4">
                          <div className="text-white font-black text-sm">
                            {pos.symbol}
                          </div>

                          <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">
                            OPEN POSITION
                          </div>
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${
                              isBuy
                                ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/20"
                                : "text-rose-400 border-rose-500/30 bg-rose-950/20"
                            }`}
                          >
                            {isBuy
                              ? <TrendingUp className="w-3 h-3" />
                              : <TrendingDown className="w-3 h-3" />
                            }
                            {pos.type}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-right text-zinc-200 font-bold">
                          {pos.volume.toFixed(2)}
                        </td>

                        <td className="px-5 py-4 text-right text-zinc-500">
                          {formatPrice(pos.openPrice)}
                        </td>

                        <td className="px-5 py-4 text-right text-white font-black">
                          {formatPrice(pos.currentPrice)}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-black text-sm ${
                            profit > 0
                              ? "text-emerald-400"
                              : profit < 0
                                ? "text-rose-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {formatMoney(profit)}
                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() => handleLiquidate(pos.ticket)}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center gap-1.5 border border-zinc-700 bg-black/40 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <Square className="w-3 h-3" />

                            {actionLoading === String(pos.ticket)
                              ? "CLOSING..."
                              : "LIQUIDATE"}
                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>
            </div>

            {/* MOBILE */}
            <div className="lg:hidden divide-y divide-white/5">

              {positions.map((pos: Position) => {

                const profit = pos.profit ?? 0;

                const positionType =
                  String(pos.type ?? "").toLowerCase();

                const isBuy =
                  positionType.includes("buy") ||
                  positionType === "long";

                return (
                  <div
                    key={String(pos.ticket)}
                    className="p-5 space-y-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <div className="text-white font-black text-lg">
                          {pos.symbol}
                        </div>

                        <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
                          TICKET #{pos.ticket}
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${
                          isBuy
                            ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/20"
                            : "text-rose-400 border-rose-500/30 bg-rose-950/20"
                        }`}
                      >
                        {isBuy
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />
                        }
                        {pos.type}
                      </span>

                    </div>

                    <div className="grid grid-cols-2 gap-px bg-zinc-900">

                      <div className="bg-zinc-950 p-3">
                        <div className="telemetry-label">VOLUME</div>
                        <div className="text-white font-black mt-1">
                          {pos.volume.toFixed(2)}
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3">
                        <div className="telemetry-label">FLOATING P/L</div>
                        <div
                          className={`font-black mt-1 ${
                            profit > 0
                              ? "text-emerald-400"
                              : profit < 0
                                ? "text-rose-400"
                                : "text-zinc-400"
                          }`}
                        >
                          {formatMoney(profit)}
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3">
                        <div className="telemetry-label">OPEN</div>
                        <div className="text-zinc-300 font-bold mt-1">
                          {formatPrice(pos.openPrice)}
                        </div>
                      </div>

                      <div className="bg-zinc-950 p-3">
                        <div className="telemetry-label">CURRENT</div>
                        <div className="text-white font-black mt-1">
                          {formatPrice(pos.currentPrice)}
                        </div>
                      </div>

                    </div>

                    <button
                      onClick={() => handleLiquidate(pos.ticket)}
                      disabled={actionLoading !== null}
                      className="w-full inline-flex items-center justify-center gap-2 border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:border-rose-500/40 hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Square className="w-3 h-3" />

                      {actionLoading === String(pos.ticket)
                        ? "CLOSING..."
                        : "LIQUIDATE"}
                    </button>

                  </div>
                );
              })}

            </div>
          </>
        )}

        <div className="px-5 py-3 border-t border-white/5 bg-black/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

          <div className="text-[9px] text-zinc-600 uppercase tracking-widest">
            SOURCE: UNIFIED GLOBAL TRADING STATE
          </div>

          <div className="text-[9px] text-amber-600/70 uppercase tracking-widest">
            LIQUIDATION ENDPOINT MIGRATION PENDING
          </div>

        </div>

      </div>

    </div>
  );
}
