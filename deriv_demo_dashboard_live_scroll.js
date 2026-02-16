const WebSocket = require('ws');
const fs = require('fs');

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    magenta: "\x1b[35m"
};

function generateScrollingChart(prices, lastSignalIndex = -1, width = 70) {
    if (!prices.length) return 'No ticks yet...';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    let line = '';
    for (let i = Math.max(0, prices.length - width); i < prices.length; i++) {
        const p = prices[i];
        let color = i === lastSignalIndex ? colors.magenta :
                    i > 0 && p > prices[i-1] ? colors.green :
                    i > 0 && p < prices[i-1] ? colors.red : colors.white;
        line += color + '*' + colors.reset;
    }
    return line;
}

function generatePLBar(pl, maxLength = 20) {
    const scaledLen = Math.min(maxLength, Math.max(1, Math.round(Math.abs(pl) * 5)));
    const bar = pl >= 0 
        ? colors.green + '▇'.repeat(scaledLen) + colors.reset
        : colors.red + '▇'.repeat(scaledLen) + colors.reset;
    return bar.padEnd(maxLength, ' ');
}

const app_id = 1089;
const token = process.env.DERIV_TOKEN;
if (!token) { console.error("Set DERIV_TOKEN first"); process.exit(1); }

const symbols = ["R_50","R_25"];
const MAX_TICK_HISTORY = 100;
const STAKE = 1, DURATION = 1, DURATION_UNIT = "t";
const MAX_TRADES_PER_SESSION = 10;
const COOLDOWN_MS = 500;
const MAX_DAILY_LOSS = 10;
const TARGET_DAILY_GAIN = 10;

let symbolData = {};
symbols.forEach(sym => symbolData[sym] = { tickHistory: [], tradeCount: 0, lastTradeTime: 0, trades: [], pl: 0, maPeriod: 5, offsetUp: 0.01, offsetDown: -0.01, lastSignalIndex: -1 });

function printDashboard() {
    console.clear();
    console.log(`${colors.cyan}===== VolSim-Pro Live Scrolling Dashboard =====${colors.reset}`);
    symbols.forEach(sym => {
        const sd = symbolData[sym];
        const header = `[${sym}] Trades: ${sd.tradeCount} | P/L: ${sd.pl.toFixed(2)} USD | MA${sd.maPeriod} | Offsets: ${sd.offsetDown.toFixed(4)}, ${sd.offsetUp.toFixed(4)}`;
        console.log(sd.pl >= 0 ? colors.green + header + colors.reset : colors.red + header + colors.reset);

        const chart = generateScrollingChart(sd.tickHistory, sd.lastSignalIndex, 70);
        console.log(chart);

        console.log(`P/L Trend: ${generatePLBar(sd.pl)}`);

        if (sd.pl <= -MAX_DAILY_LOSS) console.log(`${colors.red}[ALERT] ${sym}: Max daily loss reached${colors.reset}`);
        else if (sd.pl >= TARGET_DAILY_GAIN) console.log(`${colors.green}[ALERT] ${sym}: Target daily gain reached${colors.reset}`);
    });
}

function adaptStrategy(sd) {
    if (sd.tickHistory.length < 2) return;
    const recent = sd.tickHistory.slice(-10);
    const mean = recent.reduce((a,b)=>a+b,0)/recent.length;
    const variance = recent.reduce((a,b)=>a+Math.pow(b-mean,2),0)/recent.length;
    const volatility = Math.sqrt(variance);
    sd.maPeriod = Math.max(3, Math.min(10, Math.round(5 / (volatility/0.5 + 0.01))));
    sd.offsetUp = volatility * 0.005;
    sd.offsetDown = -volatility * 0.005;
}

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);
ws.on('open', () => { console.log("Connected to Deriv"); ws.send(JSON.stringify({ authorize: token })); });

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.msg_type === "authorize") {
        console.log("Authorized!");
        symbols.forEach(sym => ws.send(JSON.stringify({ ticks: sym, subscribe: 1 })));
    }

    if (data.msg_type === "tick") {
        const sym = data.tick.symbol;
        const price = data.tick.quote;
        const sd = symbolData[sym];

        sd.tickHistory.push(price);
        if (sd.tickHistory.length > MAX_TICK_HISTORY) sd.tickHistory.shift();
        adaptStrategy(sd);

        const recentTicks = sd.tickHistory.slice(-sd.maPeriod);
        const ma = recentTicks.reduce((a,b)=>a+b,0)/recentTicks.length;

        let signal = null;
        if (price > ma + sd.offsetUp) signal = "PUT";
        else if (price < ma + sd.offsetDown) signal = "CALL";

        const now = Date.now();
        if (signal && sd.tradeCount < MAX_TRADES_PER_SESSION && now - sd.lastTradeTime > COOLDOWN_MS) {
            sd.lastSignalIndex = sd.tickHistory.length - 1;
            console.log((signal==="CALL"?colors.green:colors.red)+`[${sym}] Signal: ${signal} → Demo trade $${STAKE}`+colors.reset);

            ws.send(JSON.stringify({ buy:1, price:STAKE, parameters:{ amount:STAKE, basis:"stake", contract_type:signal, currency:"USD", duration:DURATION, duration_unit:DURATION_UNIT, symbol:sym }}));
            sd.tradeCount++; sd.lastTradeTime = now;
        }

        printDashboard();
    }

    if (data.msg_type === "buy") {
        const buy = data.buy || {};
        const sym = buy.symbol || "N/A";
        const trade = { contract_id: buy.contract_id || "N/A", type: buy.contract_type || buy.longcode || "N/A", price: buy.buy_price || STAKE, payout: buy.payout || 0, balance_after: buy.balance_after || "N/A" };
        if (symbolData[sym]) { symbolData[sym].trades.push(trade); symbolData[sym].pl += (trade.payout || 0) - (trade.price || STAKE); }
        fs.appendFileSync('trade_log.txt', `[${new Date().toISOString()}] [${sym}] ${JSON.stringify(trade)}\n`);
        printDashboard();
    }
});

ws.on('close', () => console.log("Connection closed"));
ws.on('error', (err) => console.error("Error:", err.message));
