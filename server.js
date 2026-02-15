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
let isTrading = false; // Prevents spamming multiple trades

const connectDeriv = () => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);
    
    ws.on('open', () => ws.send(JSON.stringify({ authorize: DERIV_TOKEN })));
    
    ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.msg_type === 'authorize') {
            isDemo = msg.authorize.is_virtual === 1;
            ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
            ws.send(JSON.stringify({ ticks: SYMBOL, subscribe: 1 }));
        }

        if (msg.msg_type === 'balance') currentBalance = msg.balance.balance.toString();

        if (msg.msg_type === 'tick') {
            const price = msg.tick.quote;
            tickHistory.push(price);
            if (tickHistory.length > 20) tickHistory.shift();

            // --- MOMENTUM LOGIC: 5 GREEN BLOCKS ---
            if (tickHistory.length >= 6 && !isTrading) {
                const last6 = tickHistory.slice(-6);
                const isRising = last6.every((val, i) => i === 0 || val > last6[i-1]);

                if (isRising) {
                    console.log("\n[!] MOMENTUM DETECTED: Executing Auto-Trade...");
                    executeTrade(ws);
                }
            }

            // Visual Log
            const mode = isDemo ? "\x1b[33m[DEMO]\x1b[0m" : "\x1b[31m[REAL]\x1b[0m";
            process.stdout.write(`\r${mode} ${SYMBOL}: ${price} | Bal: $${currentBalance} | Trading: ${isTrading}   `);
        }
    });

    const executeTrade = (ws) => {
        isTrading = true;
        ws.send(JSON.stringify({
            buy: 1,
            price: 1.00,
            parameters: {
                amount: 1.00,
                basis: 'stake',
                contract_type: 'CALL',
                currency: 'USD',
                duration: 5,
                duration_unit: 't',
                symbol: SYMBOL
            }
        }));
        
        // Cooldown: Allow trade to finish (5 ticks) before looking for next pattern
        setTimeout(() => { isTrading = false; }, 10000);
    };

    ws.on('close', () => setTimeout(connectDeriv, 5000));
};

connectDeriv();

app.get('/api/deriv/account', (req, res) => res.json({ balance: currentBalance }));
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`Auto-Trader Active on Port ${PORT}`));