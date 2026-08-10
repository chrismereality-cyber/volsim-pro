"use client";

import React, { useState, useEffect } from "react";
import { Lock, ShieldAlert, Cpu, Share2, ArrowUpRight } from "lucide-react";

interface VaultData {
  trading_equity: number;
  vault_balance: number;
  equity_percentage: number;
  next_tier_allocation: string;
  last_tx_hash: string;
  web3_connected: boolean;
  timestamp: string;
}

export default function ImmutableVaultView() {
  const [data] = useState<VaultData>({
    trading_equity: 1074.44,
    vault_balance: 500.0,
    equity_percentage: 68.22,
    next_tier_allocation: "50% / 50%",
    last_tx_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    web3_connected: false,
    timestamp: "N/A",
  });

  useEffect(() => {
    // TODO:
    // This view should consume the centralized Zustand Trading Store.
    // Do not create a dedicated WebSocket here.
    // Data will arrive through the unified /ws/trading-state stream.
  }, []);

  return (
    <div className="space-y-6 p-6 font-mono text-zinc-100 bg-black min-h-screen">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            // IMMUTABLE SECONDARY VAULT SUBSYSTEM
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Asymmetric profit protection matrix via web3.py cryptographic state
            tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-[10px] px-3 py-1.5 font-bold uppercase text-zinc-400">
          <Cpu
            className={`w-3.5 h-3.5 ${
              data.web3_connected ? "text-emerald-400" : "text-zinc-500"
            }`}
          />
          WEB3_PROVIDER:{" "}
          {data.web3_connected ? "LOCAL_NODE_SECURE" : "ISOLATED_LOGGING_MODE"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            Usable Trading Equity
          </div>

          <div className="text-2xl font-black text-white">
            ${data.trading_equity.toLocaleString()}
          </div>

          <div className="text-[10px] text-zinc-500">
            // Allocated margin boundary limit
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 border-l-2 border-l-emerald-500 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Immutable Vault Balance
          </div>

          <div className="text-2xl font-black text-emerald-400">
            ${data.vault_balance.toLocaleString()}
          </div>

          <div className="text-[10px] text-zinc-500">
            // Non-drawdown protected reserves
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
            Current Allocation Tier
          </div>

          <div className="text-xl font-black text-purple-400">
            {data.next_tier_allocation}
          </div>

          <div className="text-[10px] text-zinc-500">
            // Equity Capital Weight: {data.equity_percentage}%
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-3">
        <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
          <span>
            Trading Capital Ratio Block ({data.equity_percentage}%)
          </span>

          <span>
            Vault Reserve Ratio Block (
            {(100 - data.equity_percentage).toFixed(2)}%)
          </span>
        </div>

        <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-white h-full"
            style={{ width: `${data.equity_percentage}%` }}
          />

          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${100 - data.equity_percentage}%` }}
          />
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
        <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          Cryptographic State Ledger Proof
        </div>

        <div className="bg-black border border-zinc-900 p-3 rounded text-xs text-zinc-400 break-all">
          <span className="block text-[9px] uppercase font-bold mb-1 text-zinc-600">
            Last Cryptographic Block Receipt:
          </span>

          {data.last_tx_hash}
        </div>

        <div className="text-[9px] text-zinc-600 text-right uppercase">
          Last Sync Frame Event: {data.timestamp}
        </div>
      </div>
    </div>
  );
}
