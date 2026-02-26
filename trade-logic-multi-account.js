import { logInfo } from './logger.js';

const activeTrades = [];
const primaryHedges = [];
const secondaryHedges = [];
const secondaryAccountLog = [];

// --- Open trade ---
export function onPrimaryTradeOpen(trade) {
  activeTrades.push(trade);

  const hedge = {
    symbol: trade.symbol,
    side: trade.side === 'BUY' ? 'SELL' : 'BUY',
    lotSize: trade.lotSize,
    openPrice: trade.price,
    closed: false,
    profit: 0
  };

  primaryHedges.push({ id: `primary_${trade.id}`, ...hedge });
  secondaryHedges.push({ id: `secondary_${trade.id}`, ...hedge });

  logInfo(`Trade opened ${trade.symbol} ${trade.side}`);
}

// --- Close trade ---
export function onPrimaryTradeClose(trade, closePrice, profit = 0) {
  const pid = `primary_${trade.id}`;
  const sid = `secondary_${trade.id}`;

  [primaryHedges, secondaryHedges].forEach(list => {
    const h = list.find(x => x.id === (list === primaryHedges ? pid : sid));
    if (h && !h.closed) {
      h.closed = true;
      h.closePrice = closePrice;
      h.profit = profit;
      secondaryAccountLog.push(h);
    }
  });

  logInfo(`Trade closed ${trade.id} P/L ${profit}`);
}

// --- Status getters ---
export const getPrimaryHedgeStatus = () => primaryHedges;
export const getSecondaryHedgeStatus = () => secondaryHedges;
export const getSecondaryAccountLog = () => secondaryAccountLog;

// --- Force close ---
export function forceCloseAll() {
  primaryHedges
    .filter(h => !h.closed)
    .forEach(h => onPrimaryTradeClose(
      { id: h.id.replace('primary_', '') },
      h.openPrice,
      0
    ));
}
