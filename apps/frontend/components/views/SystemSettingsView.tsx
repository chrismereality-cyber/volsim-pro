'use client';

import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Palette,
  Shield,
  Check,
  Fingerprint,
  Activity,
  Save,
} from 'lucide-react';
import { useTradingStore } from '../../store/useTradingStore';
import { useAuth } from '../../src/auth/AuthProvider';

export default function SystemSettingsView() {
  const globalTheme = useTradingStore((state) => state.theme);
  const setGlobalTheme = useTradingStore((state) => state.setTheme);

  const [saveStatus, setSaveStatus] = useState(false);

  const { registerPasskey, isLoading: authLoading } = useAuth();

  const [passkeyStatus, setPasskeyStatus] = useState<string | null>(null);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    pollingInterval: 100,
    maxSlippage: 0.5,
    logLevel: 'DEBUG',
  });

  const handleSave = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const handleRegisterPasskey = async () => {
    setPasskeyStatus(null);
    setPasskeyError(null);

    try {
      const result = await registerPasskey();

      if (result.success) {
        setPasskeyStatus('PASSKEY REGISTERED — BIOMETRIC LOGIN READY');
      } else {
        setPasskeyError('Passkey registration could not be completed.');
      }
    } catch (error) {
      setPasskeyError(
        error instanceof Error
          ? error.message
          : 'Unknown passkey registration error.'
      );
    }
  };

  return (
    <div className="telemetry-shell space-y-5 p-1">
      {/* HEADER */}
      <div className="telemetry-section flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="telemetry-sublabel mb-2">
            SYSTEM / CONFIGURATION / CONTROL
          </div>

          <h1
            className={`text-2xl md:text-3xl font-black tracking-[0.08em] uppercase flex items-center gap-3 ${
              globalTheme === 'hacker'
                ? 'text-emerald-400'
                : 'text-white'
            }`}
          >
            <Settings className="w-6 h-6 text-emerald-500" />
            ENGINE SYSTEM CONFIGURATION
          </h1>

          <p className="text-xs md:text-sm mt-2 text-zinc-500 uppercase tracking-wide">
            Runtime interface, execution thresholds, risk controls, and
            authentication security.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2"
        >
          {saveStatus ? (
            <>
              <Check className="w-4 h-4" />
              CHANGES APPLIED
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              SAVE RUNTIME CONFIG
            </>
          )}
        </button>
      </div>

      {/* TOP CONFIGURATION MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* THEME */}
        <div className="telemetry-card p-5">
          <div className="telemetry-section flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-400" />
            INTERFACE THEME
          </div>

          <div className="telemetry-sublabel mt-1 mb-4">
            OPTICAL PRESENTATION PROFILE
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setGlobalTheme('dark')}
              className={`w-full p-3 text-left border rounded transition-all flex justify-between items-center ${
                globalTheme === 'dark'
                  ? 'bg-white/[0.06] border-emerald-500/70 text-white'
                  : 'bg-black/20 border-white/10 text-zinc-500 hover:border-white/20'
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase">
                Tactical Dark
              </span>

              {globalTheme === 'dark' && (
                <span className="text-[9px] font-black text-emerald-400">
                  ACTIVE
                </span>
              )}
            </button>

            <button
              onClick={() => setGlobalTheme('light')}
              className={`w-full p-3 text-left border rounded transition-all flex justify-between items-center ${
                globalTheme === 'light'
                  ? 'bg-white/[0.06] border-zinc-400 text-white'
                  : 'bg-black/20 border-white/10 text-zinc-500 hover:border-white/20'
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase">
                Clean Light
              </span>

              {globalTheme === 'light' && (
                <span className="text-[9px] font-black text-zinc-300">
                  ACTIVE
                </span>
              )}
            </button>

            <button
              onClick={() => setGlobalTheme('hacker')}
              className={`w-full p-3 text-left border rounded transition-all flex justify-between items-center ${
                globalTheme === 'hacker'
                  ? 'bg-emerald-950/20 border-emerald-500/70 text-emerald-400'
                  : 'bg-black/20 border-white/10 text-zinc-500 hover:border-white/20'
              }`}
            >
              <span className="font-mono text-xs font-bold uppercase">
                &gt;_ Terminal / Hacker
              </span>

              {globalTheme === 'hacker' && (
                <span className="text-[9px] font-black text-emerald-400">
                  ACTIVE
                </span>
              )}
            </button>
          </div>
        </div>

        {/* EXECUTION */}
        <div className="telemetry-card p-5">
          <div className="telemetry-section flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            EXECUTION PROFILE
          </div>

          <div className="telemetry-sublabel mt-1 mb-5">
            BROKER BRIDGE / EXECUTION THRESHOLDS
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="telemetry-label">
                  MT5 BRIDGE POLLING
                </label>

                <span className="text-xs font-black text-blue-400">
                  {config.pollingInterval} MS
                </span>
              </div>

              <input
                type="number"
                value={config.pollingInterval}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    pollingInterval: Number(e.target.value),
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white font-mono focus:outline-none focus:border-blue-500/60 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="telemetry-label">
                  MAX SLIPPAGE TOLERANCE
                </label>

                <span className="text-xs font-black text-amber-400">
                  {config.maxSlippage}%
                </span>
              </div>

              <input
                type="number"
                step="0.1"
                value={config.maxSlippage}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxSlippage: Number(e.target.value),
                  })
                }
                className="w-full bg-black/40 border border-white/10 rounded p-2.5 text-white font-mono focus:outline-none focus:border-amber-500/60 text-xs"
              />
            </div>
          </div>
        </div>

        {/* RISK */}
        <div className="telemetry-card p-5">
          <div className="telemetry-section flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            RISK MITIGATION
          </div>

          <div className="telemetry-sublabel mt-1 mb-5">
            PROTECTIVE CONTROL SURFACES
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded">
              <div>
                <span className="text-xs font-mono font-black block text-white uppercase">
                  Dynamic Deleverage Loop
                </span>
                <span className="text-[9px] text-zinc-600 uppercase">
                  Exposure reduction control
                </span>
              </div>

              <input
                type="checkbox"
                defaultChecked
                className="rounded border-zinc-900 bg-zinc-950 text-emerald-500 w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-black/20 border border-white/10 rounded">
              <div>
                <span className="text-xs font-mono font-black block text-white uppercase">
                  IPC Fail-Safe Trigger
                </span>
                <span className="text-[9px] text-zinc-600 uppercase">
                  Inter-process protection
                </span>
              </div>

              <input
                type="checkbox"
                defaultChecked
                className="rounded border-zinc-900 bg-zinc-950 text-emerald-500 w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* AUTHENTICATION */}
      <div className="telemetry-card p-5 border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="telemetry-section flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              AUTHENTICATION SECURITY
            </div>

            <div className="telemetry-sublabel mt-1">
              WEBAUTHN / DEVICE-BOUND IDENTITY
            </div>

            <div className="mt-4">
              <div className="text-sm font-black text-white uppercase">
                WebAuthn Passkey
              </div>

              <p className="text-[11px] leading-relaxed text-zinc-500 mt-1 max-w-2xl">
                Register this authenticated device with WebAuthn so biometric
                login can be used without changing the existing authentication
                architecture.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-stretch lg:items-end gap-3">
            <button
              type="button"
              onClick={handleRegisterPasskey}
              disabled={authLoading}
              className="shrink-0 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2"
            >
              <Fingerprint className="w-4 h-4" />
              {authLoading ? 'REGISTERING...' : 'REGISTER PASSKEY'}
            </button>

            <div className="flex items-center gap-2 text-[9px] uppercase font-black tracking-wider text-zinc-600">
              <Activity className="w-3 h-3" />
              AUTHENTICATED DEVICE CONTROL
            </div>
          </div>
        </div>

        {passkeyStatus && (
          <div className="mt-4 border border-emerald-900/60 bg-emerald-950/20 rounded p-3 text-[11px] font-mono text-emerald-400">
            {passkeyStatus}
          </div>
        )}

        {passkeyError && (
          <div className="mt-4 border border-red-900/60 bg-red-950/20 rounded p-3 text-[11px] font-mono text-red-400">
            {passkeyError}
          </div>
        )}
      </div>

      {/* RUNTIME STATE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="telemetry-readout">
          <span className="telemetry-label">RUNTIME LOG LEVEL</span>
          <strong>{config.logLevel}</strong>
        </div>

        <div className="telemetry-readout">
          <span className="telemetry-label">BRIDGE STATE</span>
          <strong className="telemetry-positive">CONFIGURABLE</strong>
        </div>

        <div className="telemetry-readout">
          <span className="telemetry-label">SECURITY LAYER</span>
          <strong className="telemetry-positive">WEBAUTHN READY</strong>
        </div>
      </div>
    </div>
  );
}
