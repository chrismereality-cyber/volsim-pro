"use client";

import React from "react";
import {
  Lock,
  ShieldAlert,
  Cpu,
  Share2,
  ArrowUpRight,
  Database,
  CircleDollarSign,
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

  const formatMoney = (value: number) =>
    `$${Number(value ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="telemetry-shell space-y-6 p-6 font-mono min-h-screen">
      <div className="telemetry-section border-b border-white/10 pb-5">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <div className="telemetry-sublabel mb-2">
              CAPITAL PROTECTION / ACCOUNTING INTEGRITY
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-[0.12em] text-white uppercase">
              IMMUTABLE CAPITAL VAULT
            </h1>

            <p className="text-xs md:text-sm text-zinc-500 mt-2 max-w-3xl uppercase tracking-wide">
              Canonical profit-allocation state synchronized through the unified
              trading-state stream.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`telemetry-status ${
                web3Connected
                  ? "telemetry-status-online"
                  : "telemetry-status-neutral"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              {web3Connected
                ? "BLOCKCHAIN CONNECTED"
                : "ISOLATED LOGGING MODE"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="telemetry-card p-5">
          <div className="telemetry-label flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-400" />
            TRADING EQUITY
          </div>

          <div className="telemetry-value-xl mt-3 text-white">
            {formatMoney(vault.trading_equity_balance)}
          </div>

          <div className="telemetry-sublabel mt-2">
            ACTIVE TRADING CAPITAL / {vault.equity_percentage}% ALLOCATION
          </div>
        </div>

        <div className="telemetry-card p-5 border-emerald-500/40 bg-emerald-500/[0.03]">
          <div className="telemetry-label flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            IMMUTABLE VAULT
          </div>

          <div className="telemetry-value-xl mt-3 text-emerald-400">
            {formatMoney(vault.vault_balance)}
          </div>

          <div className="telemetry-sublabel mt-2">
            PROTECTED RESERVE / {vault.vault_percentage}% ALLOCATION
          </div>
        </div>

        <div className="telemetry-card p-5 border-purple-500/30">
          <div className="telemetry-label flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
            ALLOCATION PROFILE
          </div>

          <div className="telemetry-value-lg mt-3 text-purple-400">
            {allocationLabel}
          </div>

          <div className="telemetry-sublabel mt-2 uppercase">
            {vault.allocation_profile}
          </div>
        </div>
      </div>

      <div className="telemetry-card p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
          <div>
            <div className="telemetry-section mb-1">
              CAPITAL ALLOCATION CONTROL
            </div>

            <div className="telemetry-sublabel">
              CORE-SATELLITE CAPITAL DISTRIBUTION
            </div>
          </div>

          <div className="telemetry-status telemetry-status-online">
            70 / 30 POLICY
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <div className="telemetry-label">TRADING EQUITY</div>
            <div className="text-lg font-black text-white mt-1">
              {vault.equity_percentage}%
            </div>
          </div>

          <div className="text-right">
            <div className="telemetry-label">IMMUTABLE VAULT</div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {vault.vault_percentage}%
            </div>
          </div>
        </div>

        <div className="w-full h-4 bg-black border border-white/10 overflow-hidden flex">
          <div
            className="bg-white h-full"
            style={{ width: `${vault.equity_percentage}%` }}
          />

          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${vault.vault_percentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="telemetry-card p-4">
          <div className="telemetry-label flex items-center gap-2">
            <CircleDollarSign className="w-4 h-4 text-amber-400" />
            PENDING ALLOCATION
          </div>

          <div className="telemetry-value-lg mt-3">
            {formatMoney(vault.pending_allocation)}
          </div>
        </div>

        <div className="telemetry-card p-4">
          <div className="telemetry-label flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            TOTAL ALLOCATED
          </div>

          <div className="telemetry-value-lg mt-3">
            {formatMoney(vault.total_allocated)}
          </div>
        </div>

        <div className="telemetry-card p-4">
          <div className="telemetry-label">SYNCHRONIZATION</div>

          <div className="telemetry-value-md mt-3 telemetry-positive uppercase">
            {vault.sync_status}
          </div>
        </div>

        <div className="telemetry-card p-4 border-emerald-500/20">
          <div className="telemetry-label">VAULT STATE</div>

          <div className="telemetry-value-md mt-3 text-emerald-400">
            IMMUTABLE
          </div>

          <div className="telemetry-sublabel mt-1">
            NON-TRADABLE / NO MARGIN
          </div>
        </div>
      </div>

      <div className="telemetry-card p-5">
        <div className="telemetry-section mb-1">
          VAULT INTEGRITY TELEMETRY
        </div>

        <div className="telemetry-sublabel mb-4">
          CRYPTOGRAPHIC STATE / PERSISTENCE / SYNCHRONIZATION
        </div>

        <div className="bg-black border border-white/10 p-4">
          <div className="telemetry-label flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            LAST CRYPTOGRAPHIC BLOCK RECEIPT
          </div>

          <div className="text-xs text-zinc-400 break-all leading-relaxed">
            {lastTxHash}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between gap-2 mt-3 text-[9px] uppercase tracking-wider text-zinc-600">
          <span>
            LAST SYNC FRAME: {syncTimestamp}
          </span>

          <span>
            PROVIDER:{" "}
            {web3Connected
              ? vault.blockchain_network
              : "ISOLATED"}
          </span>
        </div>
      </div>

      <div className="telemetry-card p-5 border-amber-500/20">
        <div className="telemetry-section mb-2">
          CAPITAL PROTECTION RULES
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="telemetry-readout">
            <span className="telemetry-label">TRADING ACCESS</span>
            <strong>ACTIVE EQUITY ONLY</strong>
          </div>

          <div className="telemetry-readout">
            <span className="telemetry-label">VAULT ACCESS</span>
            <strong>PROTECTED RESERVE</strong>
          </div>

          <div className="telemetry-readout">
            <span className="telemetry-label">MARGIN STATUS</span>
            <strong>VAULT EXCLUDED</strong>
          </div>
        </div>
      </div>

      {vault.last_persist_error && (
        <div className="telemetry-card border-red-500/40 bg-red-950/10 p-4">
          <div className="telemetry-label text-red-400">
            PERSISTENCE ERROR
          </div>

          <div className="text-xs text-red-300 mt-2 uppercase">
            {vault.last_persist_error}
          </div>
        </div>
      )}
    </div>
  );
}
