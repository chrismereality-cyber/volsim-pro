'use client';

import React, { useState } from 'react';
import { Settings, Sliders, Palette, Shield, Check } from 'lucide-react';
import { useTradingStore, ThemeType } from '../../store/useTradingStore';

export default function SystemSettingsView() {
  const globalTheme = useTradingStore((state) => state.theme);
  const setGlobalTheme = useTradingStore((state) => state.setTheme);
  const [saveStatus, setSaveStatus] = useState(false);

  const [config, setConfig] = useState({
    pollingInterval: 100,
    maxSlippage: 0.5,
    logLevel: 'DEBUG'
  });

  const handleSave = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  return (
    <div className="space-y-6 p-1">
      <div className="flex justify-between items-start border-b border-zinc-900/60 pb-4">
        <div>
          <h1 className={`text-xl font-black tracking-tight flex items-center gap-2 ${globalTheme === 'hacker' ? 'text-emerald-400' : 'text-white'}`}>
            <Settings className="w-5 h-5 text-emerald-500" /> // ENGINE SYSTEM CONFIGURATION MATRIX
          </h1>
          <p className="text-xs mt-1 text-zinc-500">
            Configure top-tier execution parameters, risk control thresholds, and high-performance visual display matrices.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded shadow transition-all flex items-center gap-2"
        >
          {saveStatus ? (<><Check className="w-3.5 h-3.5" /> CHANGES APPLIED</>) : 'SAVE RUNTIME CONFIG'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`border p-5 rounded space-y-4 bg-zinc-950 ${globalTheme === 'hacker' ? 'border-emerald-900/60 text-emerald-400' : 'border-zinc-900'}`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider border-b pb-2 flex items-center gap-2 ${globalTheme === 'hacker' ? 'text-emerald-400 border-emerald-950' : 'text-white border-zinc-900'}`}>
            <Palette className="w-4 h-4 text-amber-500" /> Interface Theme Presets
          </h3>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Select an operational presentation frame configured to maintain clean optical precision across volatile shifts.
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setGlobalTheme('dark')}
              className={`w-full p-3 rounded text-left border flex justify-between items-center transition-all ${globalTheme === 'dark' ? 'bg-zinc-900 border-emerald-500 text-white' : 'bg-zinc-950 border-zinc-900 text-zinc-400'}`}
            >
              <div className="font-mono text-xs font-bold">Tactical Dark</div>
              {globalTheme === 'dark' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => setGlobalTheme('light')}
              className={`w-full p-3 rounded text-left border flex justify-between items-center transition-all ${globalTheme === 'light' ? 'bg-zinc-900 border-zinc-400 text-white' : 'bg-zinc-950 border-zinc-900 text-zinc-400'}`}
            >
              <div className="font-mono text-xs font-bold">Clean Light</div>
              {globalTheme === 'light' && <div className="w-2 h-2 rounded-full bg-zinc-400" />}
            </button>

            <button
              onClick={() => setGlobalTheme('hacker')}
              className={`w-full p-3 rounded text-left border flex justify-between items-center transition-all ${globalTheme === 'hacker' ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400' : 'bg-zinc-950 border-zinc-900 text-zinc-400'}`}
            >
              <div className="font-mono text-xs font-bold">&gt;_ Terminal / Hacker</div>
              {globalTheme === 'hacker' && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          </div>
        </div>

        <div className="border border-zinc-900 p-5 rounded space-y-4 bg-zinc-950">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2 text-white">
            <Sliders className="w-4 h-4 text-blue-500" /> Core Execution Profiles
          </h3>
          <div className="space-y-4 pt-1 text-xs">
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] block text-zinc-400">MT5 Bridge Polling Rate (ms)</label>
              <input type="number" value={config.pollingInterval} onChange={(e) => setConfig({...config, pollingInterval: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-900 rounded p-2 text-white font-mono focus:outline-none focus:border-zinc-700 text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] block text-zinc-400">Max Execution Slippage Tolerance (%)</label>
              <input type="number" step="0.1" value={config.maxSlippage} onChange={(e) => setConfig({...config, maxSlippage: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-900 rounded p-2 text-white font-mono focus:outline-none focus:border-zinc-700 text-xs" />
            </div>
          </div>
        </div>

        <div className="border border-zinc-900 p-5 rounded space-y-4 bg-zinc-950">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-zinc-900 pb-2 flex items-center gap-2 text-white">
            <Shield className="w-4 h-4 text-purple-500" /> Risk Mitigation Engines
          </h3>
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950/40 border border-zinc-900/60">
              <div>
                <span className="text-xs font-mono font-bold block text-white">Dynamic Deleverage Loop</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-zinc-900 bg-zinc-950 text-emerald-500 w-4 h-4 accent-emerald-500 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950/40 border border-zinc-900/60">
              <div>
                <span className="text-xs font-mono font-bold block text-white">IPC Fail-Safe Trigger</span>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-zinc-900 bg-zinc-950 text-emerald-500 w-4 h-4 accent-emerald-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
