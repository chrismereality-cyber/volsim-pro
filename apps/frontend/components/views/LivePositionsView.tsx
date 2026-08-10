"use client";

import React, { useMemo, useState } from "react";
import { Radio, Square } from "lucide-react";
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

  return (
    <div className="space-y-4 p-6 bg-black min-h-screen text-zinc-100 font-mono">

      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">

        <div>

          <h1 className="text-xl font-bold flex items-center gap-2">

            <Radio
              className={
                connected
                  ? "w-4 h-4 text-emerald-500 animate-pulse"
                  : "w-4 h-4 text-rose-500"
              }
            />

            // LIVE POSITIONS

          </h1>

          <p className="text-xs text-zinc-500">
            Unified Global Trading State
          </p>

        </div>

        <div className="text-xs font-bold uppercase">

          {positions.length} Active Orders

        </div>

      </div>

      <table className="w-full text-xs">

        <thead>

          <tr>

            <th>Ticket</th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Volume</th>
            <th>Open</th>
            <th>Current</th>
            <th>P/L</th>
            <th></th>

          </tr>

        </thead>

        <tbody>

          {positions.length === 0 ? (

            <tr>

              <td colSpan={8} className="text-center p-10">

                No Active Positions

              </td>

            </tr>

          ) : (

            positions.map((pos: Position) => (

              <tr key={String(pos.ticket)}>

                <td>{pos.ticket}</td>
                <td>{pos.symbol}</td>
                <td>{pos.type}</td>
                <td>{pos.volume}</td>
                <td>{pos.openPrice ?? 0}</td>
                <td>{pos.currentPrice ?? 0}</td>
                <td>{pos.profit ?? 0}</td>

                <td>

                  <button
                    onClick={() => handleLiquidate(pos.ticket)}
                    disabled={actionLoading !== null}
                  >
                    <Square className="w-3 h-3 inline" />

                    {actionLoading === String(pos.ticket)
                      ? "Closing..."
                      : "Liquidate"}

                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

      <div className="font-bold">

        Total Floating P/L:
        {" "}
        ${totalFloating.toFixed(2)}

      </div>

    </div>
  );
}
