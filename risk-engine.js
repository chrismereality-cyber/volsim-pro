const VALID_SIDES = ['BUY', 'SELL'];
const VALID_SYMBOLS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];

const MAX_HEDGES_TOTAL = 10;
const MAX_HEDGES_PER_SYMBOL = 2;
const MAX_LOT_PER_SYMBOL = 3;

export function validateTrade(trade, primaryHedges) {
  if (!trade.id || !trade.symbol || !trade.side || !trade.price) {
    return 'Missing required trade fields';
  }

  if (!VALID_SYMBOLS.includes(trade.symbol)) {
    return `Invalid symbol: ${trade.symbol}`;
  }

  if (!VALID_SIDES.includes(trade.side)) {
    return `Invalid side: ${trade.side}`;
  }

  if (trade.lotSize <= 0 || trade.lotSize > 5) {
    return `Invalid lot size: ${trade.lotSize}`;
  }

  if (trade.price <= 0) {
    return 'Invalid price';
  }

  const openHedges = primaryHedges.filter(h => !h.closed);

  if (openHedges.length >= MAX_HEDGES_TOTAL) {
    return 'Max total hedges reached';
  }

  const symbolHedges = openHedges.filter(h => h.symbol === trade.symbol);
  if (symbolHedges.length >= MAX_HEDGES_PER_SYMBOL) {
    return `Max hedges reached for ${trade.symbol}`;
  }

  const lotExposure = symbolHedges.reduce((s, h) => s + h.lotSize, 0);
  if (lotExposure + trade.lotSize > MAX_LOT_PER_SYMBOL) {
    return `Lot exposure too high for ${trade.symbol}`;
  }

  return null;
}
