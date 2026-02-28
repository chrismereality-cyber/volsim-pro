const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

let tradeData = { account: { equity: "19.69", profit: "0.00", vault: 0 }, trades: [] };

// Primary Route
app.get('/', (req, res) => res.status(200).send('TITAN v5.8.2: FINAL SYNC ACTIVE'));

// Health Check Route (Helps Render mark it as LIVE faster)
app.get('/health', (req, res) => res.status(200).send('OK'));

app.get('/api/trade/status', (req, res) => res.json(tradeData));
app.post('/api/trade/status', (req, res) => { tradeData = req.body; res.sendStatus(200); });

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log('TITAN CORE LIVE'));