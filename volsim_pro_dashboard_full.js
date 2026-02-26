const WebSocket = require('ws');
const fs = require('fs');

// --- INSTRUCTIONS & CONFIG ---
const APP_ID = 1089;
const DERIV_TOKEN = process.env.DERIV_TOKEN;
const SYMBOL = "R_50";
let tickHistory = [];
let totalPL = 0;
let lastSignal = "WAITING";

// --- DASHBOARD TOOLS ---
const generatePriceChart = () => {
    if (tickHistory.length < 2) return "Initializing Market Feed...";
    let chart = "";
    const displayTicks = tickHistory.slice(-40);
    displayTicks.forEach((tick, i) => {
        if (i === 0) return;
        const color = tick > displayTicks[i-1] ? "\x1b[32m" : "\x1b[31m"; // Green up, Red down
        chart += `${color}█\x1b[0m`;
    });
    return chart;
};

const generatePLBar = () => {
    const length = 20;
    const progress = Math.min(Math.abs(totalPL) / 10, 1);
    const bars = "█".repeat(Math.floor(progress * length));
    const spaces = " ".repeat(length - bars.length);
    const color = totalPL >= 0 ? "\x1b[32m" : "\x1b[31m";
    return `[${color}${bars}${spaces}\x1b[0m] $${totalPL.toFixed(2)}`;
};

const printDashboard = (price) => {
    console.clear();
    console.log(`\x1b[35m=== VOLSIM-PRO AUTOPILOT [${SYMBOL}] ===\x1b[0m`);
    console.log(`CURRENT_PRICE: ${price}`);
    console.log(`MARKET_TREND:  ${generatePriceChart()}`);
    console.log(`SESSION_P/L:   ${generatePLBar()}`);
    console.log(`LAST_SIGNAL:   ${lastSignal}`);
    console.log(`\x1b[35m========================================\x1b[0m`);
};

// --- WEBSOCKET ENGINE ---
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

ws.on('open', () => {
    ws.send(JSON.stringify({ authorize: DERIV_TOKEN }));
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);

    if (msg.msg_type === 'authorize') {
        ws.send(JSON.stringify({ ticks: SYMBOL, subscribe: 1 }));
    }

    if (msg.msg_type === 'tick') {
        const price = msg.tick.quote;
        tickHistory.push(price);
        if (tickHistory.length > 100) tickHistory.shift();
        
        // Simple logic for signal marker
        if (tickHistory.length > 5) {
            const avg = tickHistory.slice(-5).reduce((a,b) => a+b) / 5;
            lastSignal = price > avg ? "\x1b[32mBUY_ZONE\x1b[0m" : "\x1b[31mSELL_ZONE\x1b[0m";
        }
        
        printDashboard(price);
    }
});

ws.on('close', () => process.exit(1)); // Render will auto-restart