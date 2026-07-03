import { create } from 'zustand';

interface Position {
  ticket: number; symbol: string; type: 'BUY' | 'SELL'; volume: number;
  price_open: number; price_current: number; sl: number; tp: number; profit: number; time: string;
}

interface MarketAsset {
  symbol: string; bid: number; ask: number; spread: number; digits: number; volume_min: number; description: string;
}

interface TradingState {
  isFastApiConnected: boolean; isBrokerConnected: boolean; balance: number; equity: number;
  floatingPl: number; currentDrawdown: number; winRate: number; profitFactor: number;
  expectancy: number; sharpeRatio: number; maxDrawdown: number; riskRewardRatio: number;
  totalTrades: number; avgDurationMinutes: number; dailyPl: number; weeklyPl: number; monthlyPl: number;
  totalNetProfit: number; cagr: number; positions: Position[];
  marketSymbols: MarketAsset[];
  updateMetrics: (metrics: Partial<TradingState>) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  isFastApiConnected: false, isBrokerConnected: false, balance: 0, equity: 0, floatingPl: 0,
  currentDrawdown: 0, winRate: 0, profitFactor: 0, expectancy: 0, sharpeRatio: 0, maxDrawdown: 0,
  riskRewardRatio: 0, totalTrades: 0, avgDurationMinutes: 0, dailyPl: 0, weeklyPl: 0, monthlyPl: 0,
  totalNetProfit: 0, cagr: 0, positions: [],
  marketSymbols: [],
  updateMetrics: (metrics) => set((state) => {
    const cleanUpdates: Partial<TradingState> = {};
    
    // Core structural metrics that should never flash back to 0 once loaded
    const protectedMetrics = [
      'balance', 'equity', 'totalNetProfit', 'cagr', 'expectancy', 
      'sharpeRatio', 'riskRewardRatio', 'avgDurationMinutes'
    ];

    for (const [key, value] of Object.entries(metrics)) {
      if (value !== undefined && value !== null) {
        // If the metric is protected, current state has data, and incoming is 0, skip it!
        if (protectedMetrics.includes(key) && value === 0 && (state as any)[key] !== 0) {
          continue;
        }
        (cleanUpdates as any)[key] = value;
      }
    }
    return { ...state, ...cleanUpdates };
  }),
}));
