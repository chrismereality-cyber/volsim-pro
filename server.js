const express = require('express');
const { WebSocket } = require('ws');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DERIV_TOKEN = process.env.DERIV_TOKEN;
const APP_ID = 1089;

let currentBalance = "0.00";
let isDemo = true;

const connectDeriv = () => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.on('open', () => ws.send(JSON.stringify({ authorize: DERIV_TOKEN })));
    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.msg_type === 'authorize') {
            isDemo = msg.authorize.is_virtual === 1;
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }
        if (msg.msg_type === 'balance') currentBalance = msg.balance.balance.toString();
    });
    ws.on('close', () => setTimeout(connectDeriv, 5000));
};
connectDeriv();

// FIX: Root route to stop "Cannot GET /"
app.get('/', (req, res) => {
    res.send(`ORACLE_ACTIVE: ${isDemo ? "DEMO_MODE" : "REAL_MODE"} | BAL: ${currentBalance}`);
});

app.get('/api/deriv/account', (req, res) => {
    res.json({ balance: currentBalance });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Oracle Active on Port ${PORT}`));