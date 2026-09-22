import { create } from "zustand";

export interface TradingPosition {
  id?: string;
  ticket?: string | number;
  symbol?: string;
  asset?: string;
  type?: string;
  lots?: number;
  volume?: number;
  profit?: number;
  [key: string]: unknown;
}

export interface HedgingSignal {
  asset?: string;
  action?: string;
  status?: string;
  [key: string]: unknown;
}

interface TradingState {
  balance: number;
  equity: number;
  floatingPl: number;

  currentDrawdown: number;
  maxDrawdown: number;

  winRate: number;
  profitFactor: number;
  expectancy: number;
  sharpeRatio: number;
  totalTrades: number;

  positions: TradingPosition[];

  riskPerTrade: number;
  marginUsage: number;
  liquidationWarning: boolean;

  portfolioValue: number;
  netExposure: number;
  valueAtRisk: number;
  riskStatus: string;

  hedgingSignals: HedgingSignal[];

  connected: boolean;
  lastUpdate: string | null;

  setTradingState: (payload: Record<string, unknown>) => void;
  setConnected: (connected: boolean) => void;
}

function numberValue(
  value: unknown,
  fallback = 0
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function arrayValue<T>(
  value: unknown
): T[] {
  return Array.isArray(value) ? value : [];
}

export const useTradingStore = create<TradingState>((set) => ({
  balance: 0,
  equity: 0,
  floatingPl: 0,

  currentDrawdown: 0,
  maxDrawdown: 0,

  winRate: 0,
  profitFactor: 0,
  expectancy: 0,
  sharpeRatio: 0,
  totalTrades: 0,

  positions: [],

  riskPerTrade: 0,
  marginUsage: 0,
  liquidationWarning: false,

  portfolioValue: 0,
  netExposure: 0,
  valueAtRisk: 0,
  riskStatus: "UNKNOWN",

  hedgingSignals: [],

  connected: false,
  lastUpdate: null,

  setConnected: (connected) =>
    set({ connected }),

  setTradingState: (payload) =>
    set({
      balance: numberValue(payload.balance),
      equity: numberValue(payload.equity),

      floatingPl: numberValue(
        payload.floatingPl ??
        payload.floating_pl ??
        payload.floatingProfit
      ),

      currentDrawdown: numberValue(
        payload.currentDrawdown ??
        payload.current_drawdown
      ),

      maxDrawdown: numberValue(
        payload.maxDrawdown ??
        payload.max_drawdown
      ),

      winRate: numberValue(
        payload.winRate ??
        payload.win_rate
      ),

      profitFactor: numberValue(
        payload.profitFactor ??
        payload.profit_factor
      ),

      expectancy: numberValue(payload.expectancy),

      sharpeRatio: numberValue(
        payload.sharpeRatio ??
        payload.sharpe_ratio
      ),

      totalTrades: numberValue(
        payload.totalTrades ??
        payload.total_trades
      ),

      positions: arrayValue<TradingPosition>(
        payload.positions
      ),

      riskPerTrade: numberValue(
        payload.riskPerTrade ??
        payload.risk_per_trade
      ),

      marginUsage: numberValue(
        payload.marginUsage ??
        payload.margin_usage
      ),

      liquidationWarning: Boolean(
        payload.liquidationWarning ??
        payload.liquidation_warning ??
        false
      ),

      portfolioValue: numberValue(
        payload.portfolioValue ??
        payload.portfolio_value
      ),

      netExposure: numberValue(
        payload.netExposure ??
        payload.net_exposure
      ),

      valueAtRisk: numberValue(
        payload.valueAtRisk ??
        payload.value_at_risk
      ),

      riskStatus: String(
        payload.riskStatus ??
        payload.risk_status ??
        "UNKNOWN"
      ),

      hedgingSignals: arrayValue<HedgingSignal>(
        payload.hedgingSignals ??
        payload.hedging_signals
      ),

      lastUpdate: new Date().toISOString(),
    }),
}));