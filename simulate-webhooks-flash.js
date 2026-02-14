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

// Keep previous P/L to detect changes
let prevPrimaryProfit = {};
let prevSecondaryProfit = {};

// Format profit with flashing effect if changed
function formatProfitFlash(profit, id, prevMap) {
  const prev = prevMap[id] || 0;
  prevMap[id] = profit; // update previous
  if(profit > prev) return chalk.bgGreen.black(` ${profit} `); // profit increased
  if(profit < prev) return chalk.bgRed.white(` ${profit} `);   // profit decreased
  return chalk.yellow(`${profit}`);                             // no change
}

// Print table
function printHedgeTable(title, hedges, prevMap){
  const table = new Table({ head:['ID','Symbol','Side','Lot','Open','Closed','Profit'], colWidths:[15,10,8,6,8,8,10] });
  hedges.forEach(h => table.push([h.id, h.symbol, h.side, h.lotSize, h.openPrice, h.closed, formatProfitFlash(h.profit, h.id, prevMap)]));
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
  console.log(`Total Primary Hedge P/L: ${chalk.green(totalPrimary)}`);
  console.log(`Total Secondary Hedge P/L: ${chalk.green(totalSecondary)}`);
  console.log(chalk.bold.cyan(`GRAND TOTAL P/L: ${grandTotal}`));
}

// Clear terminal
function clearScreen(){
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
}

// Send trades sequentially with flashing
async function sendTradesLive(){
  for(const trade of simulatedTrades){
    const resp = await fetch(API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(trade)
    });
    const data = await resp.json();

    clearScreen();
    console.log(chalk.blue(`Trade sent: ${trade.symbol} ${trade.side} @ ${trade.price}`));
    printHedgeTable('Primary Hedge Status', data.primaryHedgeStatus, prevPrimaryProfit);
    printHedgeTable('Secondary Hedge Status', data.secondaryHedgeStatus, prevSecondaryProfit);
    printSummary(data.primaryHedgeStatus, data.secondaryHedgeStatus);

    await new Promise(r => setTimeout(r, 1000));
  }

  // Force close all remaining hedges
  const respClose = await fetch(FORCE_CLOSE_URL, { method:'POST' });
  const closeData = await respClose.json();

  clearScreen();
  console.log(chalk.red('\nAll remaining hedges force-closed!'));
  printHedgeTable('Primary Hedge Status', closeData.primaryHedgeStatus, prevPrimaryProfit);
  printHedgeTable('Secondary Hedge Status', closeData.secondaryHedgeStatus, prevSecondaryProfit);
  printHedgeTable('Secondary Account Log', closeData.secondaryAccountLog, prevSecondaryProfit);
  printSummary(closeData.primaryHedgeStatus, closeData.secondaryHedgeStatus);
}

sendTradesLive().catch(console.error);
