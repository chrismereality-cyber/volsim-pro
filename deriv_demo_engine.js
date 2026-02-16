const WebSocket = require('ws');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

if (!token) {
    console.error("No API token found. Set DERIV_TOKEN first.");
    process.exit(1);
}

const symbol = "R_50"; // Volatility 50 Index
const STAKE = 1;        // $1 per trade
const DURATION = 1;     // 1 tick contract
const DURATION_UNIT = "t";

// Moving average parameters
const MA_PERIOD = 5;
let tickHistory = [];

// Trade thresholds offsets from MA
const OFFSET_UP = 0.01;   // price above MA → SELL
const OFFSET_DOWN = -0.01; // price below MA → BUY

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");

    ws.send(JSON.stringify({
        authorize: token
    }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.msg_type === "authorize") {
        console.log("Authorized!");

        ws.send(JSON.stringify({
            ticks: symbol,
            subscribe: 1
        }));
    }

    if (data.msg_type === "tick") {
        const price = data.tick.quote;
        tickHistory.push(price);
        if (tickHistory.length > MA_PERIOD) tickHistory.shift();

        const ma = tickHistory.reduce((a,b) => a+b, 0)/tickHistory.length;
        console.log(`Price: ${price.toFixed(4)} | MA${MA_PERIOD}: ${ma.toFixed(4)}`);

        // Determine signal
        let signal = null;
        if (price > ma + OFFSET_UP) signal = "PUT";  // SELL
        else if (price < ma + OFFSET_DOWN) signal = "CALL"; // BUY

        // Execute demo trade
        if (signal) {
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
        }
    }

    // Confirm trade execution (fixed type logging)
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
