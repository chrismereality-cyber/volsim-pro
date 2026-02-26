const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock Database of Experts
const experts = [
    { id: 1, name: "Risk Manager AI", specialty: "Hedging" },
    { id: 2, name: "Volatility Bot", specialty: "Breakouts" },
    { id: 3, name: "Scalp Master", specialty: "High Frequency" }
];

let currentTradeData = { balance: "0.00", equity: "0.00", price: "0.00" };

// NEW: Health Check
app.get('/health', (req, res) => res.json({ status: "ok" }));

// NEW: Experts Endpoint (This stops the 404)
app.get('/api/experts', (req, res) => {
    console.log("Sending experts to frontend...");
    res.json(experts);
});

app.get('/api/trade/account', (req, res) => {
    res.json(currentTradeData);
});

app.post('/api/trade/status', (req, res) => {
    const { account } = req.body;
    if (account) {
        currentTradeData = {
            balance: account.balance,
            equity: account.equity,
            price: account.price
        };
        res.status(200).json({ status: "success" });
    } else {
        res.status(400).json({ error: "Invalid data" });
    }
});

app.get('/', (req, res) => res.send("Titan Bridge Root Online"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Titan Server running on port ${PORT}`));
