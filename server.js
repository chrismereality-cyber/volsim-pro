const express = require('express');
const { WebSocket } = require('ws');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const DERIV_TOKEN = process.env.DERIV_TOKEN;
const APP_ID = 1089;
const SYMBOL = "R_50";

let currentBalance = "0.00";
let tickHistory = [];
let isDemo = true;

// --- ASCII ENGINE ---
const generatePriceChart = () => {
    if (tickHistory.length < 2) return "Establishing Feed...";
    let chart = "";
    const displayTicks = tickHistory.slice(-25); // Shorter for cleaner logs
    displayTicks.forEach((tick, i) => {
        if (i === 0) return;
        const color = tick > displayTicks[i-1] ? "\x1b[32m" : "\x1b[31m";
        chart += `${color}█\x1b[0m`;
    });
    return chart;
};

// --- ORACLE CORE ---
const connectDeriv = () => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    
    ws.on('open', () => ws.send(JSON.stringify({ authorize: DERIV_TOKEN })));
    
    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.msg_type === 'authorize') {
            // Check if it's actually a demo account
            isDemo = msg.authorize.is_virtual === 1;
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            ws.send(JSON.stringify({ ticks: SYMBOL, subscribe: 1 }));
        }
        if (msg.msg_type === 'balance') currentBalance = msg.balance.balance.toString();
        if (msg.msg_type === 'tick') {
            const price = msg.tick.quote;
            tickHistory.push(price);
            if (tickHistory.length > 50) tickHistory.shift();
            
            const mode = isDemo ? "\x1b[33m[DEMO]\x1b[0m" : "\x1b[31m[REAL]\x1b[0m";
            const trend = generatePriceChart();
            process.stdout.write(`\r${mode} ${SYMBOL}: ${price} | ${trend} | Bal: $${currentBalance}   `);
        }
    });
    ws.on('close', () => setTimeout(connectDeriv, 5000));
};

connectDeriv();

app.get('/', (req, res) => res.send("ORACLE_DEMO_RUNNING"));
app.get('/api/deriv/account', (req, res) => res.json({ balance: currentBalance, mode: isDemo ? "DEMO" : "REAL" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Oracle Active on Port ${PORT}`));