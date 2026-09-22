"use client";

import React, { useEffect, useState } from "react";
import { Lock, CheckCircle2, ArrowRightLeft } from "lucide-react";
import { TRADING_STATE_WS } from "../../apiConfig";

export default function VaultPage() {
  const [allocationRatio] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [vaultBalance, setVaultBalance] = useState<number>(0);
  const [tradingBalance, setTradingBalance] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function syncVaultReserves() {
      try {
        const baseUrl = TRADING_STATE_WS
          .replace(/^ws:\/\//, "http://")
          .replace(/^wss:\/\//, "https://")
          .replace(/\/ws\/trading-state\/?$/, "");

        const res = await fetch(`${baseUrl}/status`);

        if (!res.ok) {
          return;
        }

        const data = await res.json();

        setVaultBalance(
          Number(
            data.vault_total_balance ??
            data.telemetry?.vault_total_balance ??
            0
          )
        );

        setTradingBalance(
          Number(
            data.balance ??
            data.account_info?.balance ??
            0
          )
        );
      } catch (error) {
        console.error(
          "[VolSim] Failed syncing vault component metrics:",
          error
        );
      }
    }

    syncVaultReserves();

    const interval = setInterval(syncVaultReserves, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleWithdrawalRequest = async () => {
    setIsProcessing(true);
    setFeedback(
      "Initiating vault authorization and validation process..."
    );

    try {
      const baseUrl = TRADING_STATE_WS
        .replace(/^ws:\/\//, "http://")
        .replace(/^wss:\/\//, "https://")
        .replace(/\/ws\/trading-state\/?$/, "");

      const response = await fetch(`${baseUrl}/vault/sweep`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ratio: allocationRatio,
        }),
      });

      if (response.ok) {
        setFeedback(
          "Vault operation accepted by the backend."
        );
      } else {
        setFeedback(
          "Vault operation was rejected by the backend."
        );
      }
    } catch (error) {
      console.error(
        "[VolSim] Vault operation failed:",
        error
      );

      setFeedback(
        "Network execution fault during vault operation."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white font-mono">
      <div className="max-w-7xl mx-auto">

        <header className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
          <h1 className="text-xl font-bold tracking-wider text-amber-500">
            VOLSIM-PRO // SECURE VAULT
          </h1>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

          <div className="bg-slate-900 p-4 border border-slate-800 rounded">
            <div className="text-xs text-slate-400 uppercase">
              Vault Reserves
            </div>

            <div className="text-2xl font-bold text-amber-400 mt-2">
              ${vaultBalance.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-900 p-4 border border-slate-800 rounded">
            <div className="text-xs text-slate-400 uppercase">
              Trading Account Balance
            </div>

            <div className="text-2xl font-bold text-emerald-400 mt-2">
              ${tradingBalance.toFixed(2)}
            </div>
          </div>

        </section>

        <section className="bg-slate-900 p-5 border border-slate-800 rounded">

          <div className="flex items-center gap-2 mb-4">
            <Lock size={16} className="text-amber-400" />

            <h2 className="text-sm font-bold text-slate-300">
              IMMUTABLE VAULT CONTROL
            </h2>
          </div>

          <div className="text-xs text-slate-500 mb-4">
            Current allocation profile: {allocationRatio}% vault /
            {" "}
            {100 - allocationRatio}% trading equity.
          </div>

          <button
            onClick={handleWithdrawalRequest}
            disabled={isProcessing}
            className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-800 px-4 py-2 rounded text-xs font-bold"
          >
            {isProcessing
              ? "PROCESSING..."
              : "EXECUTE PORTFOLIO REBALANCE"}
          </button>

          {feedback && (
            <div className="text-xs mt-3 text-slate-300">
              {feedback}
            </div>
          )}

        </section>

      </div>
    </main>
  );
}
