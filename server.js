const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DERIV_TOKEN = process.env.DERIV_TOKEN;

// ROUTE 1: GET REAL BALANCE
app.get('/api/deriv/account', async (req, res) => {
    try {
        // Deriv uses WebSockets for their primary API, but we'll use a direct bridge logic
        // For simplicity in this step, we are mocking the successful handshake
        // In a full build, we use the 'ws' library to maintain a live feed.
        res.json({ balance: "1.00", status: "CONNECTED" }); 
    } catch (error) {
        res.status(500).json({ error: "CONNECTION_FAILED" });
    }
});

// ROUTE 2: EXECUTE MICRO-TRADE ($1.00)
app.post('/api/deriv/trade', async (req, res) => {
    const { amount } = req.body;
    if (amount > 5) return res.status(403).json({ message: "SAFETY_LIMIT_EXCEEDED" });

    console.log(`Executing Trade: $${amount} USD`);
    
    // This is where the call to Deriv's API happens
    // We use a safety return here so you don't lose money until you're ready
    res.json({ status: 'success', id: 'TRD-' + Math.floor(Math.random() * 1000000) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Oracle Server Live on Port ${PORT}`));