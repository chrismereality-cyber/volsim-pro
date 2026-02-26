import fetch from 'node-fetch';
import Table from 'cli-table3'; // Nice table for terminal

// Simulated trades stream (like TradingView webhook payloads)
const simulatedTrades = [
  { id: 'trade101', symbol: 'XAUUSD', side: 'SELL', lotSize: 1, price: 1930 },
  { id: 'trade102', symbol: 'EURUSD', side: 'BUY', lotSize: 1, price: 1.095 },
  { id: 'trade103', symbol: 'GBPUSD', side: 'SELL', lotSize: 1, price: 1.519 },
  { id: 'trade104', symbol: 'USDJPY', side: 'BUY', lotSize: 1, price: 148.8 },
  { id: 'trade105', symbol: 'AUDUSD', side: 'SELL', lotSize: 1, price: 0.713 }
];

const API_URL = 'http://localhost:3000/v1/new-trade';
const FORCE_CLOSE_URL = 'http://localhost:3000/v1/force-close-all';

// Utility to print a table of hedge status
function printHedgeTable(title, hedges) {
  const table = new Table({
    head: ['ID', 'Symbol', 'Side', 'Lot', 'Open', 'Closed', 'Profit'],
    colWidths: [15, 10, 8, 6, 8, 8, 10]
  });
  hedges.forEach(h => {
    table.push([h.id, h.symbol, h.side, h.lotSize, h.openPrice, h.closed, h.profit]);
  });
  console.log(`\n=== ${title} ===`);
  console.log(table.toString());
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
    printHedgeTable('Primary Hedge Status', data.primaryHedgeStatus);
    printHedgeTable('Secondary Hedge Status', data.secondaryHedgeStatus);

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Force close remaining hedges
async function forceCloseAll() {
  const resp = await fetch(FORCE_CLOSE_URL, { method: 'POST' });
  const data = await resp.json();
  console.log('\nAll open hedges force-closed!');
  printHedgeTable('Primary Hedge Status', data.primaryHedgeStatus);
  printHedgeTable('Secondary Hedge Status', data.secondaryHedgeStatus);
  printHedgeTable('Secondary Account Log', data.secondaryAccountLog);
}

// Run simulation
sendTrades().then(forceCloseAll).catch(console.error);
