const WebSocket = require('ws');
const fs = require('fs');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;
const STAKE = 1; // adjust your demo stake
const MAX_TICK_HISTORY = 100;

const symbolData = {};
const symbols = ['R_50', 'R_25']; // add symbols you track

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");
    ws.send(JSON.stringify({ authorize: token }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.msg_type === "authorize") {
        console.log("Authorized!");
        symbols.forEach(sym => ws.send(JSON.stringify({ ticks: sym, subscribe: 1 })));
    }

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

        // printDashboard() can be your existing dashboard function
        if (typeof printDashboard === "function") printDashboard();
    }
});

ws.on('close', () => console.log("Connection closed"));
ws.on('error', (err) => console.error("Error:", err.message));
