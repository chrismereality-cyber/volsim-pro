const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 10000;

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.static(path.join(__dirname, 'public')));

let state = {
    base_equity: 5847507.52,
    total_equity: 5847507.52,
    market_price: 2615.50,
    active_position: { side: 'BUY', size: 4000000, leverage: 125 },
    rank: "#2",
    shadow_fork_active: false,
    apex_target: 15000000
};

app.get('/pulse', (req, res) => {
    const drift = state.shadow_fork_active ? 15.5 : 1.5;
    state.market_price += (Math.random() - 0.3) * drift;
    
    const entry = 2615.50;
    const priceDiff = state.market_price - entry;
    let gains = (priceDiff / entry) * state.active_position.size * state.active_position.leverage;
    
    if (state.shadow_fork_active) gains *= 3.5; 
    
    state.total_equity = state.base_equity + gains;
    if (state.total_equity >= state.apex_target) state.rank = "#1 (GOD_MODE)";
    
    res.json(state);
});

app.post('/fork', (req, res) => {
    state.shadow_fork_active = true;
    res.json({ status: 'SHADOW_FORK_INITIALIZED' });
});

app.listen(port, '0.0.0.0', () => console.log(`TITAN_APEX_ONLINE`));
