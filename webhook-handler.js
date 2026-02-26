import { onPrimaryTradeOpen, onPrimaryTradeClose } from "./trade-logic.js";

/**
 * Expected TradingView payload example:
 * {
 *   "action": "OPEN",
 *   "tradeId": "tv_123",
 *   "symbol": "EURUSD",
 *   "side": "BUY",
 *   "lotSize": 1,
 *   "price": 1.0934
 * }
 */

export function handleTradeWebhook(payload) {
  const {
    action,
    tradeId,
    symbol,
    side,
    lotSize,
    price,
    profit
  } = payload;

  if (action === "OPEN") {
    onPrimaryTradeOpen({
      id: tradeId,
      symbol,
      side,
      lotSize,
      price
    });
  }

  if (action === "CLOSE") {
    onPrimaryTradeClose(
      { id: tradeId },
      price,
      profit || 0
    );
  }
}
