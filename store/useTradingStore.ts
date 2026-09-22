'use client';

import { create } from 'zustand';

export interface TradingPosition {
  id?: string;
  ticket?: string | number;
  symbol?: string;
  asset?: string;
  type?: string;
  volume?: number;
  lots?: number;
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
  connected: boolean;

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

  lastUpdated: string | null;

  setTradingState: (state: Partial<TradingState>) => void;
  setConnected: (connected: boolean) => void;
  resetTradingState: () => void;
}

const initialState = {
  connected: false,

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

  positions: [] as TradingPosition[],

  riskPerTrade: 0,
  marginUsage: 0,
  liquidationWarning: false,

  portfolioValue: 0,
  netExposure: 0,
  valueAtRisk: 0,
  riskStatus: 'UNKNOWN',

  hedgingSignals: [] as HedgingSignal[],

  lastUpdated: null as string | null,
};

export const useTradingStore = create<TradingState>((set) => ({
  ...initialState,

  setTradingState: (state) =>
    set((current) => ({
      ...current,
      ...state,
      lastUpdated: new Date().toISOString(),
    })),

  setConnected: (connected) =>
    set({
      connected,
    }),

  resetTradingState: () =>
    set({
      ...initialState,
    }),
}));
