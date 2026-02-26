const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.SECRET_TOKEN || "your_secure_token";

app.use(cors());
app.use(express.json());

let tradeLogs = [];

app.post('/trade-log', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== 'Bearer ' + AUTH_TOKEN) {
        console.error("Unauthorized access attempt");
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const tradeData = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toLocaleString()
    };
    tradeLogs.unshift(tradeData);
    if (tradeLogs.length > 100) tradeLogs.pop();
    console.log('[MT5] Trade Logged:', tradeData.ticket);
    res.status(200).json({ status: "success", received: tradeData.ticket });
});

app.get('/trade-log', (req, res) => {
    res.json(tradeLogs);
});

app.delete('/trade-log', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader === 'Bearer ' + AUTH_TOKEN) {
        tradeLogs = [];
        return res.status(200).json({ message: "Logs cleared" });
    }
    res.status(401).json({ error: "Unauthorized" });
});

app.listen(PORT, () => {
    console.log('Bridge Server active on port ' + PORT);
});
