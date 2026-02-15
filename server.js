const express = require('express');
const { WebSocket } = require('ws');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DERIV_TOKEN = process.env.DERIV_TOKEN;
const APP_ID = 1089; 

let currentBalance = "FETCHING...";

// --- ORACLE ENGINE ---
const connectDeriv = () => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.on('open', () => ws.send(JSON.stringify({ authorize: DERIV_TOKEN })));
    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.msg_type === 'authorize') ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        if (msg.msg_type === 'balance') currentBalance = msg.balance.balance.toString();
    });
    ws.on('close', () => setTimeout(connectDeriv, 5000));
};
connectDeriv();

// --- FIX: ROOT STEALTH ROUTE ---
app.get('/', (req, res) => {
    res.status(200).send("ORACLE_CORE_V6_OPERATIONAL");
});

// --- API ROUTES ---
app.get('/api/deriv/account', (req, res) => {
    res.json({ balance: currentBalance });
});

// Withdrawal Verification (Sends email to you)
app.post('/api/deriv/withdraw-verify', (req, res) => {
    // This calls Deriv to send the security code to your email
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    ws.on('open', () => {
        ws.send(JSON.stringify({ 
            authorize: DERIV_TOKEN,
            verify_email: "you@example.com", // Deriv knows your email from the token
            type: 'p2p_withdrawal' 
        }));
        res.json({ status: 'sent', message: 'Verification email triggered' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Oracle Active on Port ${PORT}`));