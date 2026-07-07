"use client";
import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, ArrowRightLeft } from 'lucide-react';

export default function VaultPage() {
  const [allocationRatio, setAllocationRatio] = useState<number>(50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [vaultBalance, setVaultBalance] = useState<number>(0.00);
  const [tradingBalance, setTradingBalance] = useState<number>(0.00);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function syncVaultReserves() {
      try {
        const res = await fetch('http://127.0.0.1:8080/status');
        if (res.ok) {
          const data = await res.json();
          setVaultBalance(data.vault_total_balance ?? data.telemetry?.vault_total_balance ?? 0.00);
          setTradingBalance(data.balance ?? data.account_info?.balance ?? 0.00);
        }
      } catch (err) {
        console.error("Failed syncing vault component metrics:", err);
      }
    }
    syncVaultReserves();
    const interval = setInterval(syncVaultReserves, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleWithdrawalRequest = async () => {
    setIsProcessing(true);
    setFeedback("Initiating Multi-Signature Vault Validation Process...");
    try {
      const response = await fetch('http://127.0.0.1:8080/vault/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratio: allocationRatio })
      });
      if (response.ok) {
        setFeedback("Vault clearing sweep executed successfully.");
      } else {
        setFeedback("Vault clearing sweep transaction failed.");
      }
    } catch (err) {
      setFeedback("Network execution fault during clear sequence.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-950 text-white min-h-screen font-mono">
      <div className="mb-6 flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold tracking-wider text-amber-500">VOLSIM // SECURE VAULT</h1>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-xs text-slate-400 uppercase">Vault Reserves</div>
          <div className="text-2xl font-bold text-amber-400">${vaultBalance.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900 p-4 border border-slate-800 rounded">
          <div className="text-xs text-slate-400 uppercase">Trading Account Balance</div>
          <div className="text-2xl font-bold text-emerald-400">${tradingBalance.toFixed(2)}</div>
        </div>
      </div>
      <div className="bg-slate-900 p-4 border border-slate-800 rounded">
        <button 
          onClick={handleWithdrawalRequest} 
          disabled={isProcessing}
          className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-800 px-4 py-2 rounded text-xs font-bold"
        >
          {isProcessing ? "PROCESSING..." : "EXECUTE PORTFOLIO REBALANCE"}
        </button>
        {feedback && <div className="text-xs mt-2 text-slate-300">{feedback}</div>}
      </div>
    </div>
  );
}
