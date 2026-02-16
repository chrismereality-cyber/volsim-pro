const WebSocket = require('ws');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

if (!token) {
    console.error("No API token found. Set DERIV_TOKEN first.");
    process.exit(1);
}

const symbol = "R_50";
const STAKE = 1;
const DURATION = 1;
const DURATION_UNIT = "t";
const MA_PERIOD = 5;
const OFFSET_UP = 0.01;
const OFFSET_DOWN = -0.01;
const MAX_TRADES_PER_SESSION = 10;
const COOLDOWN_MS = 500; // 0.5s between trades
const MAX_DAILY_LOSS = 10;
const MAX_DAILY_GAIN = 10;

let tickHistory = [];
let tradeCount = 0;
let lastTradeTime = 0;
let startingBalance = null;

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");

    ws.send(JSON.stringify({ authorize: token }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.msg_type === "authorize") {
        console.log("Authorized!");
        if (data.authorize && data.authorize.balance) {
            startingBalance = data.authorize.balance;
        }

        ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }

    if (data.msg_type === "tick") {
        const price = data.tick.quote;
        tickHistory.push(price);
        if (tickHistory.length > MA_PERIOD) tickHistory.shift();
        const ma = tickHistory.reduce((a,b)=>a+b,0)/tickHistory.length;

        console.log(`Price: ${price.toFixed(4)} | MA${MA_PERIOD}: ${ma.toFixed(4)}`);

        // Determine signal
        let signal = null;
        if (price > ma + OFFSET_UP) signal = "PUT";
        else if (price < ma + OFFSET_DOWN) signal = "CALL";

        // Check cooldown, session limits, daily profit/loss
        const now = Date.now();
        if (
            signal &&
            tradeCount < MAX_TRADES_PER_SESSION &&
            now - lastTradeTime > COOLDOWN_MS
        ) {
            // Compute current balance change if startingBalance is known
            if (startingBalance !== null) {
                const dailyChange = startingBalance - data.buy?.balance_after || 0;
                if (dailyChange >= MAX_DAILY_LOSS) {
                    console.log("Max daily loss reached. Pausing trades.");
                    return;
                }
            }

            console.log(`Signal: ${signal} → Placing demo trade $${STAKE}`);
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
                    symbol: symbol
                }
            }));

            tradeCount++;
            lastTradeTime = now;
        }
    }

    // Confirm trade execution safely
    if (data.msg_type === "buy") {
        const buy = data.buy || {};
        console.log("Trade executed:", {
            contract_id: buy.contract_id || "N/A",
            type: buy.contract_type || buy.longcode || "N/A",
            price: buy.buy_price || STAKE,
            payout: buy.payout || "N/A",
            balance_after: buy.balance_after || "N/A"
        });
    }
});

ws.on('close', () => console.log("Connection closed"));
ws.on('error', (err) => console.error("Error:", err.message));
