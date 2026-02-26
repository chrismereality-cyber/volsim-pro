import fetch from 'node-fetch';
import chalk from 'chalk';

// Simulated trades
const simulatedTrades = [
  { id: 'trade101', symbol: 'XAUUSD', side: 'SELL', lotSize: 1, price: 1930 },
  { id: 'trade102', symbol: 'EURUSD', side: 'BUY', lotSize: 1, price: 1.095 },
  { id: 'trade103', symbol: 'GBPUSD', side: 'SELL', lotSize: 1, price: 1.519 },
  { id: 'trade104', symbol: 'USDJPY', side: 'BUY', lotSize: 1, price: 148.8 },
  { id: 'trade105', symbol: 'AUDUSD', side: 'SELL', lotSize: 1, price: 0.713 }
];

const API_URL = 'http://localhost:3000/v1/new-trade';
const FORCE_CLOSE_URL = 'http://localhost:3000/v1/force-close-all';

// Helper to color profits
function colorProfit(p) {
  if (p > 0) return chalk.green(p);
  if (p < 0) return chalk.red(p);
  return chalk.yellow(p);
}

// Print hedge tables
function printHedges(title, hedges) {
  console.log(`\n=== ${title} ===`);
  console.table(
    hedges.map(h => ({
      ID: h.id,
      Symbol: h.symbol,
      Side: h.side,
      Lot: h.lotSize,
      Open: h.openPrice,
      Closed: h.closed,
      Profit: colorProfit(h.profit)
    }))
  );
}

// Send trades sequentially
async function sendTrades() {
  for (const trade of simulatedTrades) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade)
    });

    const data = await resp.json();

    console.log(`\nTrade sent: ${trade.symbol} ${trade.side} @ ${trade.price}`);
    printHedges('Primary Hedge Status', data.primaryHedgeStatus);
    printHedges('Secondary Hedge Status', data.secondaryHedgeStatus);

    // Wait 1 second before next trade
    await new Promise(r => setTimeout(r, 1000));
  }
}

// Force-close all remaining hedges
async function forceCloseAll() {
  const resp = await fetch(FORCE_CLOSE_URL, { method: 'POST' });
  const data = await resp.json();

  console.log(chalk.blue('\nAll open hedges force-closed!'));
  printHedges('Primary Hedge Status', data.primaryHedgeStatus);
  printHedges('Secondary Hedge Status', data.secondaryHedgeStatus);
  printHedges('Secondary Account Log', data.secondaryAccountLog);
}

// Run full simulation
sendTrades()
  .then(forceCloseAll)
  .catch(console.error);
