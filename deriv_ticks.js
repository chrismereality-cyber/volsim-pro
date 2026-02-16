const WebSocket = require('ws');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

const symbol = "R_50"; // Volatility 50 Index

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");

    // Authorize
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

    // Receive live price updates
    if (data.msg_type === "tick") {
        console.log("Price:", data.tick.quote);
    }
});

ws.on('error', (err) => {
    console.error("Error:", err.message);
});

ws.on('close', () => {
    console.log("Connection closed");
});
