import fs from 'fs';
import Table from 'cli-table3';
import chalk from 'chalk';
import { getSecondaryAccountLog } from './trade-logic-multi-account.js';

// Log file paths
const PRIMARY_LOG = './primary.log';
const SECONDARY_LOG = './secondary.log';

// Helper: read log and parse
function readLog(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [id, symbol, side, lotSize, openPrice, closed, profit] = line.split('\t');
      return { id, symbol, side, lotSize: parseFloat(lotSize), openPrice: parseFloat(openPrice), closed: closed === 'true', profit: parseFloat(profit) };
    });
}

// Helper: format profit with color
function formatProfit(p) {
  if (p > 0) return chalk.green(p.toFixed(2));
  if (p < 0) return chalk.red(p.toFixed(2));
  return chalk.yellow(p.toFixed(2));
}

// Print table
function printTable(title, hedges) {
  const table = new Table({
    head: ['ID', 'Symbol', 'Side', 'Lot', 'Open', 'Closed', 'Profit'],
    colWidths: [15, 10, 8, 6, 8, 8, 10]
  });

  hedges.forEach(h => table.push([h.id, h.symbol, h.side, h.lotSize, h.openPrice, h.closed, formatProfit(h.profit)]));
  console.log(`\n=== ${title} ===`);
  console.log(table.toString());
}

// Update dashboard every 1 second
setInterval(() => {
  console.clear();

  const primary = readLog(PRIMARY_LOG);
  const secondary = readLog(SECONDARY_LOG);
  const accountLog = getSecondaryAccountLog();

  if (primary.length === 0) console.log('No primary hedges yet.');
  else printTable('Primary Hedge Status', primary);

  if (secondary.length === 0) console.log('No secondary hedges yet.');
  else printTable('Secondary Hedge Status', secondary);

  if (accountLog.length === 0) console.log('No secondary account logs yet.');
  else {
    console.log('\n=== Secondary Account Log ===');
    accountLog.forEach(entry => {
      console.log(`${entry.hedgeId}\t${entry.symbol}\t${entry.side}\t${entry.lotSize}\t${entry.openPrice}\t${entry.closePrice}\t${formatProfit(entry.profit)}`);
    });
  }

}, 1000);

