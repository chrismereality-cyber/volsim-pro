"use client";

import React from "react";
import {
  Lock,
  ShieldAlert,
  Cpu,
  Share2,
  ArrowUpRight,
} from "lucide-react";
import { useTradingStore } from "../../store/useTradingStore";

export default function ImmutableVaultView() {
  const vault = useTradingStore((state) => state.vault);

  const allocationLabel = `${vault.equity_percentage}% / ${vault.vault_percentage}%`;

  const lastTxHash =
    vault.last_tx_hash ??
    "N/A";

  const syncTimestamp =
    vault.last_sync_time == null
      ? "N/A"
      : new Date(vault.last_sync_time * 1000).toISOString();

  const web3Connected =
    Boolean(vault.wallet_address) &&
    Boolean(vault.blockchain_network) &&
    Boolean(vault.last_tx_hash);

  return (
    <div className="space-y-6 p-6 font-mono text-zinc-100 bg-black min-h-screen">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            // IMMUTABLE SECONDARY VAULT SUBSYSTEM
          </h1>

          <p className="text-xs text-zinc-500 mt-1">
            Canonical profit-allocation state synchronized through the unified
            trading-state stream.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-[10px] px-3 py-1.5 font-bold uppercase text-zinc-400">
          <Cpu
            className={`w-3.5 h-3.5 ${
              web3Connected
                ? "text-emerald-400"
                : "text-zinc-500"
            }`}
          />

          WEB3_PROVIDER:{" "}
          {web3Connected
            ? "BLOCKCHAIN_CONNECTED"
            : "ISOLATED_LOGGING_MODE"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            Allocated Trading Equity
          </div>

          <div className="text-2xl font-black text-white">
            ${vault.trading_equity_balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div className="text-[10px] text-zinc-500">
            // Trading allocation boundary
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 border-l-2 border-l-emerald-500 p-4 space-y-2">
          <div className="text-zinc-500 text-[10px] font-bold uppercase flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Immutable Vault Balance
          </div>

          <div className="text-2xl font-black text-emerald-400">
            ${vault.vault_balance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
            {allocationLabel}
          </div>

          <div className="text-[10px] text-zinc-500">
            // Profile: {vault.allocation_profile}
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-3">
        <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-400">
          <span>
            Trading Capital Ratio Block ({vault.equity_percentage}%)
          </span>

          <span>
            Vault Reserve Ratio Block ({vault.vault_percentage}%)
          </span>
        </div>

        <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden flex">
          <div
            className="bg-white h-full"
            style={{
              width: `${vault.equity_percentage}%`,
            }}
          />

          <div
            className="bg-emerald-500 h-full"
            style={{
              width: `${vault.vault_percentage}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <div className="text-[10px] uppercase font-bold text-zinc-500">
            Pending Vault Allocation
          </div>

          <div className="text-lg font-black text-white mt-2">
            ${vault.pending_allocation.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <div className="text-[10px] uppercase font-bold text-zinc-500">
            Total Allocated
          </div>

          <div className="text-lg font-black text-white mt-2">
            ${vault.total_allocated.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <div className="text-[10px] uppercase font-bold text-zinc-500">
            Synchronization Status
          </div>

          <div className="text-lg font-black text-emerald-400 mt-2 uppercase">
            {vault.sync_status}
          </div>
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

          {lastTxHash}
        </div>

        <div className="text-[9px] text-zinc-600 text-right uppercase">
          Last Sync Frame Event: {syncTimestamp}
        </div>
      </div>

      {vault.last_persist_error && (
        <div className="bg-red-950/20 border border-red-900/50 p-3 text-[10px] text-red-400 uppercase">
          Persistence Error: {vault.last_persist_error}
        </div>
      )}
    </div>
  );
}
