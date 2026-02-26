import fetch from 'node-fetch';
import Table from 'cli-table3';
import chalk from 'chalk';

// Simulated trades stream
const simulatedTrades = [
  { id: 'trade101', symbol: 'XAUUSD', side: 'SELL', lotSize: 1, price: 1930 },
  { id: 'trade102', symbol: 'EURUSD', side: 'BUY', lotSize: 1, price: 1.095 },
  { id: 'trade103', symbol: 'GBPUSD', side: 'SELL', lotSize: 1, price: 1.519 },
  { id: 'trade104', symbol: 'USDJPY', side: 'BUY', lotSize: 1, price: 148.8 },
  { id: 'trade105', symbol: 'AUDUSD', side: 'SELL', lotSize: 1, price: 0.713 }
];

const API_URL = 'http://localhost:3000/v1/new-trade';
const FORCE_CLOSE_URL = 'http://localhost:3000/v1/force-close-all';

// Color profits
function formatProfit(profit) {
  if (profit > 0) return chalk.green(profit);
  if (profit < 0) return chalk.red(profit);
  return chalk.yellow(profit);
}

// Print hedge table
function printHedgeTable(title, hedges) {
  const table = new Table({
    head: ['ID', 'Symbol', 'Side', 'Lot', 'Open', 'Closed', 'Profit'],
    colWidths: [15, 10, 8, 6, 10, 8, 10]
  });

  hedges.forEach(h => {
    table.push([
      h.id ?? 'N/A',
      h.symbol ?? 'N/A',
      h.side ?? 'N/A',
      h.lotSize ?? 0,
      h.openPrice ?? 0,
      h.closed ?? false,
      formatProfit(h.profit ?? 0)
    ]);
  });

  console.log(`\n=== ${title} ===`);
  console.log(table.toString());
}

// Send trades sequentially
async function sendTrades() {
  for (const trade of simulatedTrades) {
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trade)
      });

      if (!resp.ok) {
        console.log(chalk.red(`Failed to send trade ${trade.id}: ${resp.statusText}`));
        continue;
      }

      const data = await resp.json();
      console.log(`\nTrade sent: ${trade.symbol} ${trade.side} @ ${trade.price}`);
      printHedgeTable('Primary Hedge Status', data.primaryHedgeStatus ?? []);
      printHedgeTable('Secondary Hedge Status', data.secondaryHedgeStatus ?? []);
    } catch (err) {
      console.log(chalk.red(`Error sending trade ${trade.id}: ${err.message}`));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Force close all hedges
async function forceCloseAll() {
  try {
    const resp = await fetch(FORCE_CLOSE_URL, { method: 'POST' });
    const data = await resp.json();
    console.log(chalk.blue('\nAll open hedges force-closed!'));
    printHedgeTable('Primary Hedge Status', data.primaryHedgeStatus ?? []);
    printHedgeTable('Secondary Hedge Status', data.secondaryHedgeStatus ?? []);
    printHedgeTable('Secondary Account Log', data.secondaryAccountLog ?? []);
  } catch (err) {
    console.log(chalk.red(`Error during force-close: ${err.message}`));
  }
}

// Run simulation + force close
sendTrades()
  .then(forceCloseAll)
  .catch(err => console.error(err));
