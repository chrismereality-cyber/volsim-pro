/**
 * Volsim Hedge Engine
 * Handles secondary-account hedging and profit isolation
 */

export class HedgeEngine {
  constructor({ primaryAccount, hedgeAccount }) {
    this.primaryAccount = primaryAccount;
    this.hedgeAccount = hedgeAccount;

    this.activeHedges = new Map(); // tradeId -> hedge data
    this.pnl = {
      primary: 0,
      hedge: 0
    };
  }

  /**
   * Open hedge when primary trade opens
   */
  openHedge(trade) {
    const hedgeTrade = {
      id: `hedge_${trade.id}`,
      symbol: trade.symbol,
      side: trade.side === 'BUY' ? 'SELL' : 'BUY',
      lotSize: trade.lotSize,
      openPrice: trade.price,
      openTime: Date.now(),
      status: 'OPEN'
    };

    this.activeHedges.set(trade.id, hedgeTrade);
    return hedgeTrade;
  }

  /**
   * Close hedge manually or automatically
   */
  closeHedge(tradeId, closePrice) {
    const hedge = this.activeHedges.get(tradeId);
    if (!hedge) return null;

    hedge.closePrice = closePrice;
    hedge.closeTime = Date.now();
    hedge.status = 'CLOSED';

    const profit =
      hedge.side === 'BUY'
        ? (closePrice - hedge.openPrice)
        : (hedge.openPrice - closePrice);

    this.pnl.hedge += profit * hedge.lotSize;

    this.activeHedges.delete(tradeId);
    return hedge;
  }

  /**
   * Track primary account PnL
   */
  updatePrimaryPnL(amount) {
    this.pnl.primary += amount;
  }

  /**
   * Auto-close all hedges after trading hours
   */
  closeAllHedges(marketPrice) {
    for (const tradeId of this.activeHedges.keys()) {
      this.closeHedge(tradeId, marketPrice);
    }
  }

  /**
   * Snapshot for dashboard / API
   */
  getStatus() {
    return {
      activeHedges: Array.from(this.activeHedges.values()),
      pnl: this.pnl
    };
  }
}
