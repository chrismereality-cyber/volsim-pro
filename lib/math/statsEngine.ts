export interface RawTradeLog {
  ticket: string;
  asset: string;
  action: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  grossPnl: number;
  commission: number;
  swap: number;
  slippagePips: number;
  maePips?: number; // Maximum Adverse Excursion
  mfePips?: number; // Maximum Favorable Excursion
}

export interface EquitySnapshot {
  timestamp: string;
  equity: number;
}

export interface AdvancedTradingMetrics {
  // 1. Core Profitability Metrics
  winRate: number;
  profitFactor: number;
  riskRewardRatio: number;
  expectancy: number;
  totalNetProfit: number;
  grossProfit: number;
  grossLoss: number;

  // 2. Risk & Drawdown Metrics
  maxDrawdownAbsolute: number;
  maxDrawdownPercent: number;
  recoveryFactor: number;

  // 3. Risk-Adjusted Performance
  sharpeRatio: number;
  sortinoRatio: number;

  // 4. Trade Statistics & Efficiency
  totalTrades: number;
  avgWinSize: number;
  avgLossSize: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;

  // 5. Cost & Execution Metrics
  totalCommissions: number;
  totalSwaps: number;
  avgSlippagePips: number;
}

export function calculateAdvancedMetrics(
  trades: RawTradeLog[], 
  equityHistory: EquitySnapshot[],
  startingBalance: number = 1000,
  riskFreeRate: number = 0.02
): AdvancedTradingMetrics {
  const totalTrades = trades.length;
  
  if (totalTrades === 0) {
    return createEmptyMetrics();
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalCommissions = 0;
  let totalSwaps = 0;
  let totalSlippage = 0;

  let currentStreak = 0;
  let consecutiveWins = 0;
  let consecutiveLosses = 0;
  let lastWasWin: boolean | null = null;

  // Process itemized trade telemetry array
  trades.forEach(trade => {
    const netPnl = trade.grossPnl - (trade.commission + trade.swap);
    totalCommissions += trade.commission;
    totalSwaps += trade.swap;
    totalSlippage += trade.slippagePips;

    if (netPnl > 0) {
      grossProfit += netPnl;
      winCount++;
      if (netPnl > largestWin) largestWin = netPnl;
      
      if (lastWasWin === true) {
        currentStreak++;
      } else {
        currentStreak = 1;
        lastWasWin = true;
      }
      if (currentStreak > consecutiveWins) consecutiveWins = currentStreak;
    } else {
      grossLoss += Math.abs(netPnl);
      lossCount++;
      if (netPnl < largestLoss) largestLoss = netPnl;

      if (lastWasWin === false) {
        currentStreak++;
      } else {
        currentStreak = 1;
        lastWasWin = false;
      }
      if (currentStreak > consecutiveLosses) consecutiveLosses = currentStreak;
    }
  });

  const totalNetProfit = grossProfit - grossLoss;
  const winRate = (winCount / totalTrades) * 100;
  const lossRate = 100 - winRate;
  
  const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
  const avgWinSize = winCount === 0 ? 0 : grossProfit / winCount;
  const avgLossSize = lossCount === 0 ? 0 : grossLoss / lossCount;
  const riskRewardRatio = avgLossSize === 0 ? avgWinSize : avgWinSize / avgLossSize;
  
  // Expectancy calculation formula
  const expectancy = ((winRate / 100) * avgWinSize) - ((lossRate / 100) * avgLossSize);

  // Peak-to-Trough Drawdown Math Engine
  let peak = startingBalance;
  let maxDrawdownAbsolute = 0;
  let maxDrawdownPercent = 0;

  equityHistory.forEach(snap => {
    if (snap.equity > peak) {
      peak = snap.equity;
    }
    const drawdownAbs = peak - snap.equity;
    const drawdownPct = peak === 0 ? 0 : (drawdownAbs / peak) * 100;

    if (drawdownAbs > maxDrawdownAbsolute) maxDrawdownAbsolute = drawdownAbs;
    if (drawdownPct > maxDrawdownPercent) maxDrawdownPercent = drawdownPct;
  });

  const recoveryFactor = maxDrawdownAbsolute === 0 ? totalNetProfit : totalNetProfit / maxDrawdownAbsolute;

  // Sharpe/Sortino standard deviation approximations
  const netReturns = trades.map(t => t.grossPnl - (t.commission + t.swap));
  const avgReturn = netReturns.reduce((a, b) => a + b, 0) / totalTrades;
  
  const variance = netReturns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / totalTrades;
  const stdDev = Math.sqrt(variance);

  const downsideReturns = netReturns.filter(r => r < 0);
  const downsideVariance = downsideReturns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / (downsideReturns.length || 1);
  const downsideStdDev = Math.sqrt(downsideVariance);

  const sharpeRatio = stdDev === 0 ? 0 : (avgReturn - (riskFreeRate / 252)) / stdDev;
  const sortinoRatio = downsideStdDev === 0 ? 0 : (avgReturn - (riskFreeRate / 252)) / downsideStdDev;

  return {
    winRate,
    profitFactor,
    riskRewardRatio,
    expectancy,
    totalNetProfit,
    grossProfit,
    grossLoss,
    maxDrawdownAbsolute,
    maxDrawdownPercent,
    recoveryFactor,
    sharpeRatio: sharpeRatio * Math.sqrt(252), // Annualized factor tracking standard
    sortinoRatio: sortinoRatio * Math.sqrt(252),
    totalTrades,
    avgWinSize,
    avgLossSize,
    largestWin,
    largestLoss,
    consecutiveWins,
    consecutiveLosses,
    totalCommissions,
    totalSwaps,
    avgSlippagePips: totalSlippage / totalTrades
  };
}

function createEmptyMetrics(): AdvancedTradingMetrics {
  return {
    winRate: 0, profitFactor: 0, riskRewardRatio: 0, expectancy: 0, totalNetProfit: 0,
    grossProfit: 0, grossLoss: 0, maxDrawdownAbsolute: 0, maxDrawdownPercent: 0, recoveryFactor: 0,
    sharpeRatio: 0, sortinoRatio: 0, totalTrades: 0, avgWinSize: 0, avgLossSize: 0,
    largestWin: 0, largestLoss: 0, consecutiveWins: 0, consecutiveLosses: 0,
    totalCommissions: 0, totalSwaps: 0, avgSlippagePips: 0
  };
}
