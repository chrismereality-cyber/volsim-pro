import { onPrimaryTradeOpen, forceCloseAllHedges, getHedgeStatus, getSecondaryAccountLog } from './trade-logic.js';

// Open trades on multiple symbols
onPrimaryTradeOpen({ id: "trade001", symbol: "EURUSD", side: "BUY", lotSize: 1, price: 1.10 });
onPrimaryTradeOpen({ id: "trade002", symbol: "GBPJPY", side: "SELL", lotSize: 0.5, price: 150.50 });
onPrimaryTradeOpen({ id: "trade003", symbol: "XAUUSD", side: "BUY", lotSize: 2, price: 1900 });

// Force close all hedges at current market price
forceCloseAllHedges();

// Print hedge status and secondary account log
console.log("Hedge Status:", getHedgeStatus());
console.log("Secondary Account Log:", getSecondaryAccountLog());
