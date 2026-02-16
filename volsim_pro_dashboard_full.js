const WebSocket = require('ws');
const fs = require('fs');

// ===== CONFIG =====
const app_id = 1089;
const token = process.env.DERIV_TOKEN; // set your demo token in env
const STAKE = 1;
const MAX_TICK_HISTORY = 100;
const MAX_TRADES_PER_SESSION = 100;
const COOLDOWN_MS = 1000;

const symbols = ['R_50', 'R_25']; // symbols to track

// ===== COLORS =====
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m"
};

// ===== DATA STRUCTURE =====
const symbolData = {};

// ===== DASHBOARD FUNCTIONS =====
function generatePLBar(pl, maxLength = 20) {
    const scaledLen = Math.min(maxLength, Math.max(1, Math.round(Math.abs(pl) * 2)));
    const bar = pl >= 0 
        ? colors.green + '▇'.repeat(scaledLen) + colors.reset
        : colors.red + '▇'.repeat(scaledLen) + colors.reset;
    return bar.padEnd(maxLength, ' ');
}

function generatePriceChart(prices, width = 50) {
    if (!prices.length) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    let line = '';
    let prev = prices[0];
    for (let p of prices) {
        const pos = Math.round(((p - min) / range) * (width - 1));
        const color = p > prev ? colors.green : p < prev ? colors.red : colors.reset;
        line += ' '.repeat(pos - line.length > 0 ? pos - line.length : 0) + color + '*' + colors.reset;
        prev = p;
    }
    return line;
}

function printDashboard() {
    console.clear();
    console.log("===== VolSim-Pro Live Gradient Dashboard w/ Trade Markers =====\n");

    symbols.forEach(sym => {
        const sd = symbolData[sym] || { tickHistory: [], trades: [], pl: 0 };
        console.log(`[${sym}] Trades: ${sd.trades.length} | P/L: ${sd.pl.toFixed(2)} USD | MA${sd.maPeriod || 5}`);
        console.log("P/L Bar: " + generatePLBar(sd.pl));
        console.log("Price Trend:\n" + generatePriceChart(sd.tickHistory.slice(-50)));
        console.log("\n");
    });
}

// ===== WEBSOCKET =====
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");
    ws.send(JSON.stringify({ authorize: token }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    // ===== AUTH =====
    if (data.msg_type === "authorize") {
        console.log("Authorized!");
        symbols.forEach(sym => ws.send(JSON.stringify({ ticks: sym, subscribe: 1 })));
    }

    // ===== TICK DATA =====
    if (data.msg_type === "tick") {
        const sym = data.tick.symbol;
        const price = data.tick.quote;

        if (!symbolData[sym]) {
            symbolData[sym] = {
                tickHistory: [],
                trades: [],
                pl: 0,
                maPeriod: 5,
                offsetUp: 0.01,
                offsetDown: -0.01,
                lastSignalIndex: -1,
                tradeCount: 0,
                lastTradeTime: 0
            };
        }

        const sd = symbolData[sym];
        sd.tickHistory.push(price);
        if (sd.tickHistory.length > MAX_TICK_HISTORY) sd.tickHistory.shift();
    }

    // ===== BUY TRADES =====
    if (data.msg_type === "buy") {
        const buy = data.buy || {};
        const sym = buy.symbol || "UNKNOWN";

        if (!symbolData[sym]) {
            symbolData[sym] = {
                tickHistory: [],
                trades: [],
                pl: 0,
                maPeriod: 5,
                offsetUp: 0.01,
                offsetDown: -0.01,
                lastSignalIndex: -1,
                tradeCount: 0,
                lastTradeTime: 0
            };
        }

        const sd = symbolData[sym];
        const trade = {
            index: sd.tickHistory.length - 1,
            contract_id: buy.contract_id || "N/A",
            type: buy.contract_type || buy.longcode || "N/A",
            price: buy.buy_price || STAKE,
            payout: buy.payout || 0,
            balance_after: buy.balance_after || "N/A"
        };

        sd.trades.push(trade);
        sd.pl += (trade.payout || 0) - (trade.price || STAKE);

        fs.appendFileSync('trade_log.txt', `[${new Date().toISOString()}] [${sym}] ${JSON.stringify(trade)}\n`);

        printDashboard();
    }
});

ws.on('close', () => console.log("Connection closed"));
ws.on('error', (err) => console.error("Error:", err.message));
