const express = require('express');
const { WebSocket } = require('ws');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DERIV_TOKEN = process.env.DERIV_TOKEN;
const APP_ID = 1089; 

let currentBalance = "0.00";

// --- LIVE WEBSOCKET CONNECTION ---
const connectDeriv = () => {
    // We use the Deriv WebSocket API for real-time streaming
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

    ws.on('open', () => {
        console.log('Oracle: Handshake Initiated...');
        // Authorize with your Admin Token
        ws.send(JSON.stringify({ authorize: DERIV_TOKEN }));
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.msg_type === 'authorize') {
            console.log('Oracle: Authorized Successfully.');
            // Subscribe to balance updates so they push automatically
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
        }

        if (msg.msg_type === 'balance') {
            currentBalance = msg.balance.balance;
            console.log(`Market Pulse: $${currentBalance}`);
        }
    });

    ws.on('close', () => {
        console.log('Oracle: Connection Lost. Reconnecting in 5s...');
        setTimeout(connectDeriv, 5000);
    });

    ws.on('error', (err) => {
        console.error('Oracle Connection Error:', err.message);
    });
};

connectDeriv();

// --- FRONTEND ENDPOINTS ---
app.get('/api/deriv/account', (req, res) => {
    res.json({ balance: currentBalance, status: "LIVE" });
});

app.post('/api/deriv/trade', (req, res) => {
    const { amount } = req.body;
    // Safety check: max $5 per order for now
    if (amount > 5) return res.status(403).json({ message: "LIMIT_EXCEEDED" });
    
    // Trade logic will be finalized in the next phase
    res.json({ status: 'success', message: `Order of $${amount} sent to queue` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Sovereign Oracle live on port ${PORT}`));