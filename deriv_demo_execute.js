const WebSocket = require('ws');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

if (!token) {
    console.error("No API token found. Set DERIV_TOKEN first.");
    process.exit(1);
}

const symbol = "R_50"; // Volatility 50 Index
let lastPrice = null;

// Trade thresholds
const UPPER_THRESHOLD = 117.74; // SELL
const LOWER_THRESHOLD = 117.72; // BUY

// Demo trade settings
const STAKE = 1; // $1 per trade
const DURATION = 1; // 1 tick contract

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");

    ws.send(JSON.stringify({
        authorize: token
    }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    // After authorization, subscribe to ticks
    if (data.msg_type === "authorize") {
        console.log("Authorized!");

        ws.send(JSON.stringify({
            ticks: symbol,
            subscribe: 1
        }));
    }

    // Live ticks
    if (data.msg_type === "tick") {
        lastPrice = data.tick.quote;
        console.log("Price:", lastPrice);

        // Determine action
        let action = null;
        if (lastPrice < LOWER_THRESHOLD) action = "CALL"; // BUY
        else if (lastPrice > UPPER_THRESHOLD) action = "PUT"; // SELL

        // Execute demo trade
        if (action) {
            console.log(`Placing demo trade: ${action} ${STAKE}$`);

            ws.send(JSON.stringify({
                buy: 1,
                price: STAKE,
                parameters: {
                    amount: STAKE,
                    basis: "stake",
                    contract_type: action,
                    currency: "USD",
                    duration: DURATION,
                    duration_unit: "t",
                    symbol: symbol
                }
            }));
        }
    }

    // Confirm trades
    if (data.msg_type === "buy") {
        console.log("Trade executed:", data);
    }
});

ws.on('close', () => {
    console.log("Connection closed");
});

ws.on('error', (err) => {
    console.error("Error:", err.message);
});
