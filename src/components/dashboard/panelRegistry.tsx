import React from "react";

import PortfolioOverviewView from "../PortfolioOverviewView";
import PerformanceAnalytics from "../PerformanceAnalytics";
import RiskManagement from "../RiskManagement";

export type PanelPermission =
  | "dashboard.view"
  | "market.view"
  | "orders.view"
  | "positions.view"
  | "chart.view"
  | "performance.view"
  | "risk.view"
  | "journal.view"
  | "regime.view"
  | "cost.view"
  | "vault.view"
  | "telemetry.view"
  | "settings.view";

export interface DashboardPanelDefinition {
  id:
    | "overview"
    | "market"
    | "order-book"
    | "live-positions"
    | "tradingview"
    | "performance"
    | "risk"
    | "journal"
    | "regime"
    | "cost"
    | "vault"
    | "telemetry"
    | "settings";

  title: string;

  description: string;

  component: React.ComponentType;

  requiredPermissions: PanelPermission[];
}

/*
 * Canonical VolSim-Pro dashboard panel registry.
 *
 * This registry defines panel identity and authorization requirements.
 *
 * IMPORTANT:
 * - It does not create WebSockets.
 * - It does not fetch trading state.
 * - It does not replace backend authorization.
 * - Panel components consume centralized application state.
 *
 * Backend RBAC remains the authoritative security boundary.
 */
export const DASHBOARD_PANELS: DashboardPanelDefinition[] = [
  {
    id: "overview",
    title: "Overview Console",
    description:
      "Core account, equity, P/L and portfolio state.",
    component: PortfolioOverviewView,
    requiredPermissions: ["dashboard.view"],
  },

  {
    id: "market",
    title: "Market Overview",
    description:
      "Market state, instruments and live market context.",
    component: () => (
      <PanelPlaceholder
        title="Market Overview"
        description="Market data panel pending implementation."
      />
    ),
    requiredPermissions: ["market.view"],
  },

  {
    id: "order-book",
    title: "Order Book",
    description:
      "Order-book and market-depth intelligence.",
    component: () => (
      <PanelPlaceholder
        title="Order Book"
        description="Order-book panel pending implementation."
      />
    ),
    requiredPermissions: ["orders.view"],
  },

  {
    id: "live-positions",
    title: "Live Positions",
    description:
      "Current open positions and exposure.",
    component: () => (
      <PanelPlaceholder
        title="Live Positions"
        description="Live positions panel pending implementation."
      />
    ),
    requiredPermissions: ["positions.view"],
  },

  {
    id: "tradingview",
    title: "TradingView Chart",
    description:
      "Primary market visualization and charting surface.",
    component: () => (
      <PanelPlaceholder
        title="TradingView Chart"
        description="Chart panel pending implementation."
      />
    ),
    requiredPermissions: ["chart.view"],
  },

  {
    id: "performance",
    title: "Performance Analytics",
    description:
      "Performance, expectancy, Sharpe and trade statistics.",
    component: PerformanceAnalytics,
    requiredPermissions: ["performance.view"],
  },

  {
    id: "risk",
    title: "Risk Management",
    description:
      "Drawdown, exposure, margin and risk controls.",
    component: RiskManagement,
    requiredPermissions: ["risk.view"],
  },

  {
    id: "journal",
    title: "Trade Journal / History",
    description:
      "Historical trade and execution records.",
    component: () => (
      <PanelPlaceholder
        title="Trade Journal / History"
        description="Trade journal panel pending implementation."
      />
    ),
    requiredPermissions: ["journal.view"],
  },

  {
    id: "regime",
    title: "Regime & Robustness",
    description:
      "Market-regime and strategy robustness intelligence.",
    component: () => (
      <PanelPlaceholder
        title="Regime & Robustness"
        description="Regime and robustness panel pending implementation."
      />
    ),
    requiredPermissions: ["regime.view"],
  },

  {
    id: "cost",
    title: "Cost Analysis",
    description:
      "Trading costs, execution costs and efficiency.",
    component: () => (
      <PanelPlaceholder
        title="Cost Analysis"
        description="Cost analysis panel pending implementation."
      />
    ),
    requiredPermissions: ["cost.view"],
  },

  {
    id: "vault",
    title: "Immutable Vault",
    description:
      "Protected capital reserve and allocation state.",
    component: () => (
      <PanelPlaceholder
        title="Immutable Vault"
        description="Immutable vault panel pending implementation."
      />
    ),
    requiredPermissions: ["vault.view"],
  },

  {
    id: "telemetry",
    title: "System Telemetry",
    description:
      "Infrastructure health and system observability.",
    component: () => (
      <PanelPlaceholder
        title="System Telemetry"
        description="System telemetry panel pending implementation."
      />
    ),
    requiredPermissions: ["telemetry.view"],
  },

  {
    id: "settings",
    title: "System Settings",
    description:
      "Administrative system configuration.",
    component: () => (
      <PanelPlaceholder
        title="System Settings"
        description="System settings panel pending implementation."
      />
    ),
    requiredPermissions: ["settings.view"],
  },
];

function PanelPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-black tracking-wider text-amber-400">
        {title}
      </h2>

      <p className="text-sm text-slate-500 mt-2">
        {description}
      </p>
    </section>
  );
}
