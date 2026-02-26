import { onPrimaryTradeOpen, onPrimaryTradeClose, getHedgeStatus, forceCloseAllHedges, getSecondaryAccountLog } from './trade-logic.js';
import express from 'express';
const app = express();

app.use(express.json());

// Endpoint: handle a new trade coming from TradingView webhook
app.post('/v1/new-trade', (req, res) => {
  const trade = req.body; // { id, symbol, side, lotSize, price }
  onPrimaryTradeOpen(trade);
  res.json({ status: 'ok', hedgeStatus: getHedgeStatus() });
});

// Endpoint: close trade manually
app.post('/v1/close-trade', (req, res) => {
  const { tradeId, closePrice, profit } = req.body;
  onPrimaryTradeClose({ id: tradeId }, closePrice, profit);
  res.json({ status: 'ok', hedgeStatus: getHedgeStatus(), secondaryLog: getSecondaryAccountLog() });
});

export default app;
