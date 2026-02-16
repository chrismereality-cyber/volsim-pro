const WebSocket = require('ws');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

if (!token) {
    console.error("No API token found. Set DERIV_TOKEN first.");
    process.exit(1);
}

const symbol = "R_50"; // Volatility 50 Index
let lastPrice = null;

// Adjusted thresholds for more frequent triggers
const UPPER_THRESHOLD = 117.74; // triggers SELL more often
const LOWER_THRESHOLD = 117.72; // triggers BUY more often

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
        lastPrice = data.tick.quote;
        console.log("Price:", lastPrice);

        // BUY signal
        if (lastPrice < LOWER_THRESHOLD) {
            console.log("Signal: BUY");
        }

        // SELL signal
        else if (lastPrice > UPPER_THRESHOLD) {
            console.log("Signal: SELL");
        }
    }
});

ws.on('close', () => {
    console.log("Connection closed");
});

ws.on('error', (err) => {
    console.error("Error:", err.message);
});
