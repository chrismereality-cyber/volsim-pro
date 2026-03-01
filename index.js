const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

let terminalState = {
    account: { equity: "19.69", profit: "0.00", vault: 0 },
    trades: [],
    version: "v5.9.7"
};

app.get('/', (req, res) => res.status(200).send(`TITAN ${terminalState.version}: CACHE PURGED`));
app.get('/api/trade/status', (req, res) => res.json(terminalState));
app.post('/api/trade/status', (req, res) => {
    terminalState.account = req.body.account || terminalState.account;
    terminalState.trades = req.body.trades || [];
    res.json({ status: "success" });
});

app.listen(PORT, () => console.log(`TITAN MASTER ONLINE ON ${PORT}`));
