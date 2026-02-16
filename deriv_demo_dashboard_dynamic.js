const WebSocket = require('ws');
const fs = require('fs');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

if (!token) {
    console.error("No API token found. Set DERIV_TOKEN first.");
    process.exit(1);
}

// Symbols to monitor
const symbols = ["R_50", "R_25"];
const STAKE = 1;
const DURATION = 1;
const DURATION_UNIT = "t";
const MAX_TRADES_PER_SESSION = 10;
const COOLDOWN_MS = 500;
const MAX_DAILY_LOSS = 10;
const TARGET_DAILY_GAIN = 10;

let symbolData = {};
symbols.forEach(sym => {
    symbolData[sym] = {
        tickHistory: [],
        tradeCount: 0,
        lastTradeTime: 0,
        startingBalance: null,
        trades: [],
        pl: 0,
        maPeriod: 5,       // adaptive MA period
        offsetUp: 0.01,    // adaptive upper threshold
        offsetDown: -0.01  // adaptive lower threshold
    };
});

// Helper: log trade
function logTrade(sym, trade) {
    const logLine = `[${new Date().toISOString()}] [${sym}] ${JSON.stringify(trade)}\n`;
    fs.appendFileSync('trade_log.txt', logLine);
}

// Helper: print dashboard
function printDashboard() {
    console.clear();
    console.log("===== VolSim-Pro Adaptive Demo Dashboard =====");
    symbols.forEach(sym => {
        const sd = symbolData[sym];
        console.log(`\n[${sym}] Trades: ${sd.tradeCount} | Cumulative P/L: ${sd.pl.toFixed(2)} USD | MA Period: ${sd.maPeriod.toFixed(0)} | Offsets: ${sd.offsetDown.toFixed(4)}, ${sd.offsetUp.toFixed(4)}`);
        sd.trades.slice(-5).forEach(t => {
            const tradePL = (t.payout || 0) - (t.price || STAKE);
            console.log(`  ${t.type} $${t.price} → payout: ${t.payout} | P/L: ${tradePL.toFixed(2)} | balance: ${t.balance_after}`);
        });

        if (sd.pl <= -MAX_DAILY_LOSS) console.log(`[ALERT] ${sym}: Max daily loss reached. Pausing trades.`);
        else if (sd.pl >= TARGET_DAILY_GAIN) console.log(`[ALERT] ${sym}: Target daily gain reached.`);
    });
}

// Adaptive function: adjust MA period and offsets based on recent volatility
function adaptStrategy(sd) {
    if (sd.tickHistory.length < 2) return;
    const recent = sd.tickHistory.slice(-10);
    const mean = recent.reduce((a,b)=>a+b,0)/recent.length;
    const variance = recent.reduce((a,b)=>a+Math.pow(b-mean,2),0)/recent.length;
    const volatility = Math.sqrt(variance);

    // Dynamic MA: smaller period for high volatility, longer for low volatility
    sd.maPeriod = Math.max(3, Math.min(10, Math.round(5 / (volatility/0.5 + 0.01))));

    // Dynamic offset: proportional to volatility
    sd.offsetUp = volatility * 0.005;
    sd.offsetDown = -volatility * 0.005;
}

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
        const sd = symbolData[sym];

        sd.tickHistory.push(price);
        if (sd.tickHistory.length > 50) sd.tickHistory.shift(); // keep last 50 ticks
        adaptStrategy(sd);

        const recentTicks = sd.tickHistory.slice(-sd.maPeriod);
        const ma = recentTicks.reduce((a,b)=>a+b,0)/recentTicks.length;

        console.log(`[${sym}] Price: ${price.toFixed(4)} | MA${sd.maPeriod}: ${ma.toFixed(4)} | Offsets: ${sd.offsetDown.toFixed(4)}, ${sd.offsetUp.toFixed(4)}`);

        let signal = null;
        if (price > ma + sd.offsetUp) signal = "PUT";
        else if (price < ma + sd.offsetDown) signal = "CALL";

        const now = Date.now();
        if (signal && sd.tradeCount < MAX_TRADES_PER_SESSION && now - sd.lastTradeTime > COOLDOWN_MS) {
            console.log(`[${sym}] Signal: ${signal} → Placing demo trade $${STAKE}`);

            ws.send(JSON.stringify({
                buy: 1,
                price: STAKE,
                parameters: {
                    amount: STAKE,
                    basis: "stake",
                    contract_type: signal,
                    currency: "USD",
                    duration: DURATION,
                    duration_unit: DURATION_UNIT,
                    symbol: sym
                }
            }));

            sd.tradeCount++;
            sd.lastTradeTime = now;
        }
    }

    if (data.msg_type === "buy") {
        const buy = data.buy || {};
        const sym = buy.symbol || "N/A";
        const trade = {
            contract_id: buy.contract_id || "N/A",
            type: buy.contract_type || buy.longcode || "N/A",
            price: buy.buy_price || STAKE,
            payout: buy.payout || 0,
            balance_after: buy.balance_after || "N/A"
        };

        if (symbolData[sym]) {
            symbolData[sym].trades.push(trade);
            symbolData[sym].pl += (trade.payout || 0) - (trade.price || STAKE);
        }

        logTrade(sym, trade);
        printDashboard();
    }
});

ws.on('close', () => console.log("Connection closed"));
ws.on('error', (err) => console.error("Error:", err.message));
