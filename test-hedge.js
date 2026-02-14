import { onPrimaryTradeOpen, onPrimaryTradeClose, getHedgeStatus, forceCloseAllHedges, getSecondaryAccountLog } from './trade-logic.js';

// Simulate opening a primary trade on XAUUSD
onPrimaryTradeOpen({ id: "trade001", symbol: "XAUUSD", side: "BUY", lotSize: 1, price: 1900 });

// Show current hedge status
console.log("Hedge Status after opening trade:", getHedgeStatus());

// Force close all hedges at market price 1910
forceCloseAllHedges(1910);

// Show updated hedge status
console.log("Hedge Status after force close:", getHedgeStatus());

// Show secondary account log
console.log("Secondary Account Log:", getSecondaryAccountLog());
