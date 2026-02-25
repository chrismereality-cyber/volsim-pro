const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let currentTradeData = {
    balance: "0.00",
    equity: "0.00",
    price: "0.00"
};

app.get('/api/trade/account', (req, res) => {
    console.log("Fetching data for frontend...");
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
        console.log(`💰 Balance Updated: ${account.balance}`);
        res.status(200).json({ status: "success" });
    } else {
        res.status(400).json({ error: "Invalid data" });
    }
});

app.get('/', (req, res) => {
    res.send("Titan Bridge Root Online");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 Titan Server running on port ${PORT}`);
});
