import fetch from 'node-fetch';
import chalk from 'chalk';
import Table from 'cli-table3';
import readline from 'readline';

const simulatedTrades = [
  { id:'trade101', symbol:'XAUUSD', side:'SELL', lotSize:1, price:1930 },
  { id:'trade102', symbol:'EURUSD', side:'BUY', lotSize:1, price:1.095 },
  { id:'trade103', symbol:'GBPUSD', side:'SELL', lotSize:1, price:1.519 },
  { id:'trade104', symbol:'USDJPY', side:'BUY', lotSize:1, price:148.8 },
  { id:'trade105', symbol:'AUDUSD', side:'SELL', lotSize:1, price:0.713 }
];

const API_URL = 'http://localhost:3000/v1/new-trade';
const FORCE_CLOSE_URL = 'http://localhost:3000/v1/force-close-all';

// Colorize profit
function formatProfit(profit){
  if(profit>0) return chalk.green(`+${profit}`);
  if(profit<0) return chalk.red(`${profit}`);
  return chalk.yellow(`${profit}`);
}

// Print table
function printHedgeTable(title, hedges){
  const table = new Table({ head:['ID','Symbol','Side','Lot','Open','Closed','Profit'], colWidths:[15,10,8,6,8,8,10] });
  hedges.forEach(h => table.push([h.id, h.symbol, h.side, h.lotSize, h.openPrice, h.closed, formatProfit(h.profit)]));
  console.log(`\n=== ${title} ===`);
  console.log(table.toString());
}

// Calculate total P/L
function calculateTotalProfit(hedges){
  return hedges.reduce((acc, h) => acc + (h.profit || 0), 0);
}

// Print live summary
function printSummary(primaryHedges, secondaryHedges){
  const totalPrimary = calculateTotalProfit(primaryHedges);
  const totalSecondary = calculateTotalProfit(secondaryHedges);
  const grandTotal = totalPrimary + totalSecondary;

  console.log(chalk.magenta('\n=== LIVE SUMMARY ==='));
  console.log(`Total Primary Hedge P/L: ${formatProfit(totalPrimary)}`);
  console.log(`Total Secondary Hedge P/L: ${formatProfit(totalSecondary)}`);
  console.log(chalk.bold.cyan(`GRAND TOTAL P/L: ${formatProfit(grandTotal)}`));
}

// Clear terminal
function clearScreen(){
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

// Send trades sequentially with live refresh
async function sendTradesLive(){
  const primaryHedges = [];
  const secondaryHedges = [];

  for(const trade of simulatedTrades){
    const resp = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(trade)
    });
    const data = await resp.json();

    // Update local arrays for live display
    primaryHedges.push(...data.primaryHedgeStatus);
    secondaryHedges.push(...data.secondaryHedgeStatus);

    clearScreen();
    console.log(chalk.blue(`Trade sent: ${trade.symbol} ${trade.side} @ ${trade.price}`));
    printHedgeTable('Primary Hedge Status', data.primaryHedgeStatus);
    printHedgeTable('Secondary Hedge Status', data.secondaryHedgeStatus);
    printSummary(data.primaryHedgeStatus, data.secondaryHedgeStatus);

    await new Promise(r => setTimeout(r, 1000));
  }

  // Force close remaining hedges
  const respClose = await fetch(FORCE_CLOSE_URL, { method:'POST' });
  const closeData = await respClose.json();

  clearScreen();
  console.log(chalk.red('\nAll remaining hedges force-closed!'));
  printHedgeTable('Primary Hedge Status', closeData.primaryHedgeStatus);
  printHedgeTable('Secondary Hedge Status', closeData.secondaryHedgeStatus);
  printHedgeTable('Secondary Account Log', closeData.secondaryAccountLog);
  printSummary(closeData.primaryHedgeStatus, closeData.secondaryHedgeStatus);
}

sendTradesLive().catch(console.error);
