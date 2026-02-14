// --- State Variables ---
let usd = 10000;
let btc = 0;
let entryPrice = 0;
let currentPrice = 30000;
let side = null; // 'long' or 'short'
let lastScore = 50;
let tradeStartTime = null;
let shieldActive = false;
let hedgePosition = null;
let totalWins = 0;
let totalTrades = 0;
let alarmInterval = null;
let sirenContext = null;

const botNames = ["WhaleHunter", "RektBilly", "MoonBoy99", "MarginCall_Joe", "SatoshisGhost", "LiquidatedLary"];

// --- Core Sync Logic ---
async function sync() {
    try {
        const res = await fetch('/v1/sentiment');
        const data = await res.json();
        
        document.getElementById('mkt-score').innerText = Math.floor(data.score) + "%";
        document.getElementById('mkt-status').innerText = data.status;
        
        let delta = data.score - lastScore;
        const volEl = document.getElementById('mkt-vol');
        volEl.innerText = Math.abs(delta) > 5 ? "? HIGH" : "Stable";
        volEl.style.color = Math.abs(delta) > 5 ? "#f6465d" : "#848e9c";
        
        lastScore = data.score;
        currentPrice = 30000 + (data.score * 500);
        document.getElementById('mid-price').innerText = "$" + currentPrice.toLocaleString();
        
        checkHedgeLogic(data.status);
        if(side) updatePL();
        if(Math.random() > 0.9) triggerLiquidation();
    } catch (e) { console.error("Sync error:", e); }
}

// --- Trade Logic ---
function openTrade(type) {
    if (side) return alert("Position already open!");
    side = type;
    entryPrice = currentPrice;
    const lev = parseInt(document.getElementById('lev').value);
    btc = (usd * lev) / entryPrice;
    tradeStartTime = new Date();
    log(`?? Opened ${type.toUpperCase()} at $${entryPrice}`);
}

function closeTrade() {
    if (!side) return;
    let mainPL = (side === 'long') ? (currentPrice - entryPrice) * btc : (entryPrice - currentPrice) * btc;
    let hedgePL = 0;
    if (hedgePosition) {
        hedgePL = (hedgePosition.side === 'long') ? (currentPrice - hedgePosition.entry) * hedgePosition.btc : (hedgePosition.entry - currentPrice) * hedgePosition.btc;
    }
    let totalPL = mainPL + hedgePL;
    
    usd += totalPL;
    generateTradeReport(totalPL);
    updateRank(totalPL > 0);
    
    side = null;
    hedgePosition = null;
    btc = 0;
    if(alarmInterval) { clearInterval(alarmInterval); alarmInterval = null; }
    log(`?? Closed position. P/L: $${totalPL.toFixed(2)}`);
}

function updatePL() {
    let mainPL = (side === 'long') ? (currentPrice - entryPrice) * btc : (entryPrice - currentPrice) * btc;
    let hedgePL = 0;
    if (hedgePosition) {
        hedgePL = (hedgePosition.side === 'long') ? (currentPrice - hedgePosition.entry) * hedgePosition.btc : (hedgePosition.entry - currentPrice) * hedgePosition.btc;
    }
    let totalPL = mainPL + hedgePL;
    const el = document.getElementById('live-pl');
    el.innerText = (totalPL >= 0 ? "+" : "") + "$" + Math.floor(totalPL);
    el.style.color = totalPL >= 0 ? "#02c076" : "#f6465d";
    
    checkMarginCall(totalPL);
    updatePeak(usd + totalPL);
}

// --- Shield & Safety ---
function toggleShield() {
    shieldActive = document.getElementById('shield-toggle').checked;
    log(shieldActive ? "??? SHIELD ACTIVE" : "??? SHIELD OFF");
}

function checkHedgeLogic(status) {
    if (!shieldActive || !side || hedgePosition) return;
    if ((side === 'long' && status === 'Bearish') || (side === 'short' && status === 'Bullish')) {
        hedgePosition = { side: (side === 'long' ? 'short' : 'long'), btc: btc * 0.5, entry: currentPrice };
        log("? SHIELD: Auto-Hedge triggered!");
    }
}

// --- Audio & UI Effects ---
function playSiren() {
    if (!sirenContext) sirenContext = new (window.AudioContext || window.webkitAudioContext)();
    const osc = sirenContext.createOscillator();
    const gain = sirenContext.createGain();
    osc.frequency.setValueAtTime(880, sirenContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, sirenContext.currentTime + 0.5);
    gain.gain.setValueAtTime(0.05, sirenContext.currentTime);
    osc.connect(gain); gain.connect(sirenContext.destination);
    osc.start(); osc.stop(sirenContext.currentTime + 0.2);
}

function checkMarginCall(pl) {
    if (pl < -(usd * 0.4) && !alarmInterval) {
        alarmInterval = setInterval(playSiren, 1000);
    } else if (pl >= -(usd * 0.4) && alarmInterval) {
        clearInterval(alarmInterval); alarmInterval = null;
    }
}

// --- Stats & Reporting ---
function updatePeak(val) {
    let peak = localStorage.getItem('volsim_peak') || 10000;
    if (val > peak) {
        localStorage.setItem('volsim_peak', val);
        document.getElementById('peak-balance').innerText = "$" + Math.floor(val).toLocaleString();
    }
}

function generateTradeReport(pl) {
    totalTrades++;
    if(pl > 0) totalWins++;
    const container = document.getElementById('trade-reports');
    const div = document.createElement('div');
    div.style.borderBottom = "1px solid #2b3139";
    div.style.padding = "5px 0";
    div.innerHTML = `<div style="display:flex; justify-content:space-between;">
        <span class="${pl >= 0 ? 'green' : 'red'}">${side.toUpperCase()}</span>
        <span>$${pl.toFixed(2)}</span>
    </div>`;
    container.prepend(div);
}

function updateRank(isWin) {
    const peak = localStorage.getItem('volsim_peak') || 10000;
    const badge = document.getElementById('rank-badge');
    if (peak > 50000) { badge.innerText = "?? MARKET MAKER"; badge.style.background = "#f0b90b"; badge.style.color = "#000"; }
    else if (peak > 15000) { badge.innerText = "?? SWING KING"; badge.style.background = "#f6465d"; }
    else { badge.innerText = "NOVICE"; badge.style.background = "#474d57"; }
}

function exportToCSV() {
    let csv = "data:text/csv;charset=utf-8,Type,Profit\n";
    document.querySelectorAll('#trade-reports div').forEach(r => {
        csv += r.innerText.replace('\n', ',') + "\n";
    });
    window.open(encodeURI(csv));
}

function log(msg) { console.log(msg); }
function fullReset() { if(confirm("Reset?")) { localStorage.clear(); location.reload(); } }

// --- Init ---
document.getElementById('peak-balance').innerText = "$" + Math.floor(localStorage.getItem('volsim_peak') || 10000).toLocaleString();
setInterval(sync, 2000);
