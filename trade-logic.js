import { HedgeEngine } from "./hedge-engine.js";

const hedgeEngine = new HedgeEngine({
  primaryAccount: "PRIMARY",
  hedgeAccount: "SECONDARY"
});

export function onPrimaryTradeOpen(trade) {
  const hedge = hedgeEngine.openHedge(trade);
  console.log("Hedge opened:", hedge);
}

export function onPrimaryTradeClose(trade, closePrice, profit) {
  hedgeEngine.updatePrimaryPnL(profit);
  hedgeEngine.closeHedge(trade.id, closePrice);
}

export function forceCloseAllHedges(marketPrice) {
  hedgeEngine.closeAllHedges(marketPrice);
}

export function getHedgeStatus() {
  return hedgeEngine.getStatus();
}
