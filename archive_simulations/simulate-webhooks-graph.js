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

// Previous P/L tracking
let prevPrimaryProfit = {};
let prevSecondaryProfit = {};

// ASCII Bar for P/L
function profitBar(profit) {
  const maxBar = 20;
  const len = Math.min(maxBar, Math.abs(Math.round(profit * 10)));
  const bar = '█'.repeat(len);
  if(profit > 0) return chalk.green(bar);
  if(profit < 0) return chalk.red(bar);
  return chalk.yellow('-'.repeat(3));
}

// Format profit text
function formatProfit(profit, id, prevMap) {
  const prev = prevMap[id] || 0;
  prevMap[id] = profit;
  if(profit > prev) return chalk.bgGreen.black(` ${profit} `);
  if(profit < prev) return chalk.bgRed.white(` ${profit} `);
  return chalk.yellow(`${profit}`);
}

// Print table with ASCII bars
function printHedgeTable(title, hedges, prevMap){
  const table = new Table({
    head:['ID','Symbol','Side','Lot','Open','Closed','Profit','Graph'],
    colWidths:[15,10,8,6,8,8,10,25]
  });

  hedges.forEach(h=>{
    table.push([
      h.id, h.symbol, h.side, h.lotSize, h.openPrice, h.closed,
      formatProfit(h.profit, h.id, prevMap),
      profitBar(h.profit)
    ]);
  });

  console.log(`\n=== ${title} ===`);
  console.log(table.toString());
}

// Calculate total P/L
function totalProfit(hedges){ return hedges.reduce((sum,h)=>sum+(h.profit||0),0); }

// Print summary
function printSummary(primary, secondary){
  const tp = totalProfit(primary);
  const ts = totalProfit(secondary);
  const total = tp + ts;
  console.log(chalk.magenta('\n=== LIVE SUMMARY ==='));
  console.log(`Primary P/L: ${chalk.green(tp)} | Secondary P/L: ${chalk.green(ts)} | Grand Total: ${chalk.cyan(total)}`);
}

// Clear terminal
function clearScreen(){
  readline.cursorTo(process.stdout,0,0);
  readline.clearScreenDown(process.stdout);
}

// Send trades sequentially
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

    await new Promise(r=>setTimeout(r,1000));
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
