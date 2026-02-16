const WebSocket = require('ws');

const app_id = 1089;
const token = process.env.DERIV_TOKEN;

if (!token) {
    console.error("No API token found. Set DERIV_TOKEN first.");
    process.exit(1);
}

const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${app_id}`);

ws.on('open', () => {
    console.log("Connected to Deriv");

    ws.send(JSON.stringify({
        authorize: token
    }));
});

ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    console.log("Response:", data);

    if (data.msg_type === "authorize") {
        console.log("Authorized!");

        ws.send(JSON.stringify({
            balance: 1
        }));
    }

    if (data.msg_type === "balance") {
        console.log("Balance:", data.balance.balance);
        ws.close();
    }
});

ws.on('close', () => {
    console.log("Connection closed");
});

ws.on('error', (err) => {
    console.error("Error:", err.message);
});
