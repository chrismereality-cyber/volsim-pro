'use client';
import React, { useState } from 'react';
import { 
  TrendingUp, Wallet, Cpu, Activity, Settings as SettingsIcon, 
  BarChart3, BookOpen, LineChart, History, Coins, ShieldCheck
} from 'lucide-react';

import { useDataStream } from '../hooks/useDataStream';
import { useTradingStore } from '../store/useTradingStore';

// Standalone views
import PortfolioOverviewView from '../components/views/PortfolioOverviewView';
import MarketOverviewView from '../components/views/MarketOverviewView';
import OrderBookView from '../components/views/OrderBookView';
import LivePositionsView from '../components/views/LivePositionsView';
import MainChartView from '../components/views/MainChartView';
import PerformanceAnalyticsView from '../components/views/PerformanceAnalyticsView';
import RiskManagementView from '../components/views/RiskManagementView';
import TradeJournalView from '../components/views/TradeJournalView';
import RegimeRobustnessView from '../components/views/RegimeRobustnessView';
import CostAnalysisView from '../components/views/CostAnalysisView';
import ImmutableVault from '../src/pages/ImmutableVault';
import SystemTelemetryView from '../components/views/SystemTelemetryView';
import SystemSettingsView from '../components/views/SystemSettingsView';

export default function EnterpriseShell() {
  const [activeTab, setActiveTab] = useState('overview');
  const isFastApiConnected = useTradingStore((state) => state.isFastApiConnected);
  const theme = useTradingStore((state) => state.theme);

  // Initialize background streaming sockets
  useDataStream();

  const navigationItems = [
    { id: "overview", name: "Overview Console", icon: TrendingUp },
    { id: "market", name: "Market Overview", icon: BarChart3 },
    { id: "orderbook", name: "Order Book", icon: BookOpen },
    { id: "positions", name: "Live Positions", icon: Activity },
    { id: "charts", name: "TradingView Chart", icon: LineChart },
    { id: "analytics", name: "Performance Analytics", icon: LineChart },
    { id: "risk-management", name: "Risk Management", icon: ShieldCheck },
    { id: "journal", name: "Trade Journal / History", icon: History },
    { id: "regime-robustness", name: "Regime & Robustness", icon: Cpu },
    { id: "cost-analysis", name: "Cost Analysis", icon: Coins },
    { id: "vault", name: "Immutable Vault", icon: Wallet },
    { id: "telemetry", name: "System Telemetry", icon: Activity },
    { id: "settings", name: "System Settings", icon: SettingsIcon }
  ];

  // Map theme styles across structural layout hulls
  const getShellBg = () => {
    if (theme === 'light') return 'bg-zinc-100 text-zinc-900';
    if (theme === 'hacker') return 'bg-black text-emerald-400 font-mono';
    return 'bg-black text-zinc-100';
  };

  const getAsideBg = () => {
    if (theme === 'light') return 'bg-white border-zinc-200';
    if (theme === 'hacker') return 'bg-black border-emerald-950/80';
    return 'bg-zinc-950 border-zinc-900';
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden transition-colors duration-300 ${getShellBg()}`}>
      <aside className={`w-64 border-r flex flex-col justify-between p-4 flex-shrink-0 ${getAsideBg()}`}>
        <div>
          <div className="flex flex-col gap-1 px-2 mb-6">
            <h1 className={`text-md font-black tracking-tighter ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>VOLSIM-PRO</h1>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Enterprise Edition</span>
          </div>
          <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-140px)] primitive-scroll space-y-0.5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              
              let btnClass = isSelected ? "bg-zinc-900 text-emerald-400 border border-zinc-800" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50";
              if (theme === 'light') {
                btnClass = isSelected ? "bg-zinc-200 text-zinc-900 font-bold border border-zinc-300" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100";
              } else if (theme === 'hacker') {
                btnClass = isSelected ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500" : "text-emerald-600 hover:text-emerald-400";
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium font-mono tracking-tight transition-all text-left ${btnClass}`}
                >
                  <Icon className={`w-4 h-4 ${theme === 'hacker' ? 'text-emerald-600' : 'text-zinc-500'}`} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
        <div className={`border-t pt-4 px-2 flex flex-col gap-2 flex-shrink-0 ${theme === 'light' ? 'border-zinc-200' : 'border-zinc-900'}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isFastApiConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            <span className="text-[10px] font-mono uppercase text-zinc-400">
              {isFastApiConnected ? "FASTAPI PORT 10000 LIVE" : "FASTAPI DISCONNECTED"}
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-6">
        {activeTab === "overview" && <PortfolioOverviewView />}
        {activeTab === "market" && <MarketOverviewView />}
        {activeTab === "orderbook" && <OrderBookView />}
        {activeTab === "positions" && <LivePositionsView />}
        {activeTab === "charts" && <MainChartView />}
        {activeTab === "analytics" && <PerformanceAnalyticsView />}
        {activeTab === "risk-management" && <RiskManagementView />}
        {activeTab === "journal" && <TradeJournalView />}
        {activeTab === "regime-robustness" && <RegimeRobustnessView />}
        {activeTab === "cost-analysis" && <CostAnalysisView />}
        {activeTab === "vault" && <ImmutableVault />}
        {activeTab === "telemetry" && <SystemTelemetryView />}
        {activeTab === "settings" && <SystemSettingsView />}
      </main>
    </div>
  );
}
