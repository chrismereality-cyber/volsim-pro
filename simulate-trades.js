import { onPrimaryTradeOpen, onPrimaryTradeClose, getHedgeStatus, getSecondaryAccountLog } from './trade-logic.js';
import fs from 'fs';

// Example trades to simulate
const trades = [
  { id: "trade001", symbol: "XAUUSD", side: "SELL", lotSize: 1, price: 1930 },
  { id: "trade002", symbol: "EURUSD", side: "BUY", lotSize: 1, price: 1.095 },
  { id: "trade003", symbol: "GBPUSD", side: "BUY", lotSize: 1, price: 1.52 },
  { id: "trade004", symbol: "USDJPY", side: "SELL", lotSize: 1, price: 148.8 }
];

// Open all trades
trades.forEach(trade => onPrimaryTradeOpen(trade));

// Close some trades manually
onPrimaryTradeClose({ id: "trade001" }, 1935, 5);   // XAUUSD profit
onPrimaryTradeClose({ id: "trade002" }, 1.10, 0.005); // EURUSD profit

// Collect final status
const output = {
  status: "ok",
  hedgeStatus: getHedgeStatus(),
  secondaryLog: getSecondaryAccountLog()
};

// Write output to JSON file
fs.writeFileSync('simulate-trades-output.json', JSON.stringify(output, null, 2));

console.log("Simulation complete. Output saved to simulate-trades-output.json");
