"use client";

import React, { useEffect, useState } from "react";
import { TRADING_STATE_WS } from "../../apiConfig";

interface Position {
  id: string;
  asset: string;
  type: "BUY" | "SELL";
  lots: number;
  profit: number;
}

interface TradeStatus {
  active_positions?: any[];
  free_margin?: number;
  leverage?: number;
  account_info?: {
    free_margin?: number;
    leverage?: number;
  };
}

export default function TradePage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [engineMetrics, setEngineMetrics] = useState({
    margin: 0,
    leverage: "1:500",
  });

  useEffect(() => {
    async function fetchLivePositions() {
      try {
        const baseUrl = TRADING_STATE_WS
          .replace(/^ws:\/\//, "http://")
          .replace(/^wss:\/\//, "https://")
          .replace(/\/ws\/trading-state\/?$/, "");

        const res = await fetch(`${baseUrl}/status`);

        if (!res.ok) {
          return;
        }

        const data: TradeStatus = await res.json();
        const active = Array.isArray(data.active_positions)
          ? data.active_positions
          : [];

        setPositions(
          active.map((pos: any) => ({
            id: String(pos.ticket ?? pos.id ?? ""),
            asset: String(pos.symbol ?? pos.asset ?? "UNKNOWN"),
            type: String(pos.type ?? "")
              .toUpperCase()
              .includes("BUY")
              ? "BUY"
              : "SELL",
            lots: Number(pos.volume ?? pos.lots ?? 0),
            profit: Number(pos.profit ?? 0),
          }))
        );

        const freeMargin =
          data.free_margin ??
          data.account_info?.free_margin ??
          0;

        const leverage =
          data.leverage ??
          data.account_info?.leverage ??
          500;

        setEngineMetrics({
          margin: Number(freeMargin),
          leverage: `1:${leverage}`,
        });
      } catch (error) {
        console.error(
          "[VolSim] Failed syncing trade panel context:",
          error
        );
      }
    }

    fetchLivePositions();

    const interval = setInterval(fetchLivePositions, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white font-mono">
      <div className="max-w-7xl mx-auto">

        <header className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold tracking-wider text-emerald-400">
            VOLSIM-PRO // TRADING PANEL
          </h1>
        </header>

        <section className="bg-slate-900 p-4 border border-slate-800 rounded mb-4">
          <div className="text-xs text-slate-400 uppercase">
            Free Margin: ${engineMetrics.margin.toFixed(2)}
            {" | "}
            Leverage: {engineMetrics.leverage}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-300">
              LIVE POSITIONS
            </h2>

            <span className="text-xs text-slate-500">
              {positions.length} OPEN
            </span>
          </div>

          {positions.length > 0 ? (
            <div className="space-y-2">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="bg-slate-950 border border-slate-800 rounded p-4 flex justify-between"
                >
                  <span>{position.asset}</span>

                  <span className="text-slate-300">
                    {position.type} · {position.lots} lots
                  </span>

                  <span>
                    ${position.profit.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              No open positions.
            </div>
          )}
        </section>

        <p className="text-xs text-slate-500 italic mt-4">
          Trading execution remains controlled by the backend execution
          and authorization layers. This panel is observational.
        </p>

      </div>
    </main>
  );
}
