import fetch from 'node-fetch';
import Table from 'cli-table3';
import chalk from 'chalk';

const FORCE_CLOSE_URL = 'http://localhost:3000/v1/force-close-all';

// Format profit for color
function formatProfit(profit) {
  if (profit > 0) return chalk.green(profit);
  if (profit < 0) return chalk.red(profit);
  return chalk.yellow(profit);
}

// Print table helper
function printTable(title, hedges) {
  const table = new Table({
    head: ['ID', 'Symbol', 'Side', 'Lot', 'Open', 'Closed', 'Profit'],
    colWidths: [15, 10, 8, 6, 8, 8, 10]
  });

  hedges.forEach(h => {
    table.push([
      h.id,
      h.symbol,
      h.side,
      h.lotSize,
      h.openPrice,
      h.closed,
      formatProfit(h.profit)
    ]);
  });

  console.log(`\n=== ${title} ===`);
  console.log(table.toString());
}

// Force close all trades
async function forceCloseAll() {
  try {
    const resp = await fetch(FORCE_CLOSE_URL, { method: 'POST' });
    const data = await resp.json();

    console.log(chalk.blue('\nAll open hedges force-closed!'));

    printTable('Primary Hedge Status', data.primaryHedgeStatus);
    printTable('Secondary Hedge Status', data.secondaryHedgeStatus);
    printTable('Secondary Account Log', data.secondaryAccountLog);
  } catch (err) {
    console.error('Error force-closing trades:', err.message);
  }
}

forceCloseAll();
