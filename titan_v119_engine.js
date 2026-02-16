const WebSocket = require('ws');
const fs = require('fs');

// ===== CONFIG =====
const APP_ID = 1089;
const TOKEN = process.env.DERIV_TOKEN;

const SYMBOLS = ['R_50', 'R_25'];
const STAKE = 5;

const MAX_HISTORY = 100;
const COOLDOWN_MS = 1500;
const MAX_DAILY_LOSS = -50;
const TARGET_DAILY_GAIN = 50;

// ===== COLORS =====
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

// ===== STATE =====
const S = {};
let globalPL = 0;

// ===== INIT SYMBOL =====
function init(sym) {
  if (!S[sym]) {
    S[sym] = {
      ticks: [],
      trades: [],
      pl: 0,
      lastTrade: 0,
      tradeCount: 0,
      maPeriod: 5,
      momentumPeriod: 8,
      offset: 0.01,
      lastSignal: "NONE"
    };
  }
}

// ===== MOVING AVERAGE =====
function MA(arr, p) {
  if (arr.length < p) return arr[arr.length - 1] || 0;
  const slice = arr.slice(-p);
  return slice.reduce((a,b)=>a+b,0)/p;
}

// ===== MOMENTUM (8-TICK FILTER) =====
function momentum(arr, p=8) {
  if (arr.length < p) return 0;
  return arr[arr.length - 1] - arr[arr.length - p];
}

// ===== SIGNAL ENGINE =====
function getSignal(sd) {
  const price = sd.ticks[sd.ticks.length - 1];
  const ma = MA(sd.ticks, sd.maPeriod);
  const mom = momentum(sd.ticks, sd.momentumPeriod);

  if (!price) return null;

  if (price > ma + sd.offset && mom > 0) return "CALL";
  if (price < ma - sd.offset && mom < 0) return "PUT";

  return null;
}

// ===== TRADE EXECUTION =====
function trade(sym, type) {
  const sd = S[sym];

  // SHIELD
  if (sd.pl <= MAX_DAILY_LOSS) {
    console.log(`${C.red}[SHIELD] ${sym} max loss hit${C.reset}`);
    return;
  }

  if (sd.pl >= TARGET_DAILY_GAIN) {
    console.log(`${C.green}[TARGET] ${sym} target reached${C.reset}`);
    return;
  }

  // COOLDOWN
  if (Date.now() - sd.lastTrade < COOLDOWN_MS) return;

  sd.lastTrade = Date.now();
  sd.lastSignal = type;

  console.log(`${C.yellow}[${sym}] EXECUTE ${type} $${STAKE}${C.reset}`);

  ws.send(JSON.stringify({
    buy: 1,
    price: STAKE,
    parameters: {
      amount: STAKE,
      basis: "stake",
      contract_type: type,
      currency: "USD",
      duration: 1,
      duration_unit: "t",
      symbol: sym
    }
  }));
}

// ===== DASHBOARD =====
function bar(pl) {
  const len = Math.min(20, Math.max(1, Math.abs(pl)));
  const color = pl >= 0 ? C.green : C.red;
  return color + '▇'.repeat(len) + C.reset;
}

function chart(arr, width=50) {
  if (!arr.length) return '';

  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;

  let out = '';
  let prev = arr[0];

  for (let p of arr.slice(-width)) {
    const pos = Math.round(((p - min) / range) * (width - 1));
    const col = p > prev ? C.green : p < prev ? C.red : C.cyan;
    out += ' '.repeat(Math.max(0, pos - out.length)) + col + '*' + C.reset;
    prev = p;
  }

  return out;
}

function dashboard() {
  console.clear();

  console.log("===== TITAN v119 STABLEGUARD =====");
  console.log(`GLOBAL P/L: ${globalPL.toFixed(2)} USD\n`);

  SYMBOLS.forEach(sym => {
    const sd = S[sym] || {ticks:[],pl:0,trades:[]};

    console.log(`[${sym}] Trades:${sd.trades.length} | P/L:${sd.pl.toFixed(2)} | Last:${sd.lastSignal}`);
    console.log("P/L:", bar(sd.pl));
    console.log(chart(sd.ticks));
    console.log("");
  });
}

// ===== WEBSOCKET =====
const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`);

ws.on('open', () => {
  console.log("Connected");
  ws.send(JSON.stringify({authorize: TOKEN}));
});

ws.on('message', (msg) => {
  const data = JSON.parse(msg);

  // AUTH
  if (data.msg_type === "authorize") {
    console.log("Authorized");

    SYMBOLS.forEach(sym => {
      init(sym);
      ws.send(JSON.stringify({ticks: sym, subscribe: 1}));
    });
  }

  // TICKS
  if (data.msg_type === "tick") {
    const sym = data.tick.symbol;
    const price = data.tick.quote;

    init(sym);
    const sd = S[sym];

    sd.ticks.push(price);
    if (sd.ticks.length > MAX_HISTORY) sd.ticks.shift();

    const signal = getSignal(sd);
    if (signal) trade(sym, signal);

    dashboard();
  }

  // TRADE RESULT
  if (data.msg_type === "buy") {
    const b = data.buy || {};
    const sym = b.symbol || "UNKNOWN";

    init(sym);
    const sd = S[sym];

    const profit = (b.payout || 0) - (b.buy_price || STAKE);

    sd.pl += profit;
    globalPL += profit;

    sd.trades.push({
      id: b.contract_id,
      type: b.contract_type,
      profit: profit
    });

    fs.appendFileSync("trade_log.txt",
      `[${new Date().toISOString()}] ${sym} ${profit}\n`
    );
  }
});

ws.on('close', () => console.log("Disconnected"));
ws.on('error', (e) => console.log("Error:", e.message));
