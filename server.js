const express = require('express');
const { WebSocket } = require('ws');
const cors = require('cors');
const app = express();

// Force Allow Vercel and Mobile access
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const DERIV_TOKEN = process.env.DERIV_TOKEN;
const APP_ID = 1089; 

let currentBalance = "FETCHING...";

const connectDeriv = () => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

    ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: DERIV_TOKEN }));
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.msg_type === 'authorize') {
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }
        if (msg.msg_type === 'balance') {
            currentBalance = msg.balance.balance.toString();
        }
    });

    ws.on('close', () => {
        setTimeout(connectDeriv, 5000);
    });
};

connectDeriv();

app.get('/api/deriv/account', (req, res) => {
    res.set('Access-Control-Allow-Origin', '*'); // Extra safety header
    res.json({ balance: currentBalance, status: "LIVE" });
});

app.post('/api/deriv/trade', (req, res) => {
    res.json({ status: 'success', message: "Order Received" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Oracle Active on Port ${PORT}`));