import express from 'express';
import {
  onPrimaryTradeOpen,
  onPrimaryTradeClose,
  getPrimaryHedgeStatus,
  getSecondaryHedgeStatus,
  getSecondaryAccountLog,
  forceCloseAll
} from './trade-logic-multi-account.js';

const router = express.Router();

// --- Create new trade ---
router.post('/v1/new-trade', (req, res) => {
  const trade = req.body; // { id, symbol, side, lotSize, price }
  onPrimaryTradeOpen(trade);

  res.json({
    status: 'ok',
    primaryHedgeStatus: getPrimaryHedgeStatus(),
    secondaryHedgeStatus: getSecondaryHedgeStatus()
  });
});

// --- Close trade manually ---
router.post('/v1/close-trade', (req, res) => {
  const { tradeId, closePrice, profit } = req.body;
  onPrimaryTradeClose({ id: tradeId }, closePrice, profit);

  res.json({
    status: 'ok',
    primaryHedgeStatus: getPrimaryHedgeStatus(),
    secondaryHedgeStatus: getSecondaryHedgeStatus(),
    secondaryAccountLog: getSecondaryAccountLog()
  });
});

// --- Force close all open hedges ---
router.post('/v1/force-close-all', (req, res) => {
  forceCloseAll();

  res.json({
    status: 'ok',
    primaryHedgeStatus: getPrimaryHedgeStatus(),
    secondaryHedgeStatus: getSecondaryHedgeStatus(),
    secondaryAccountLog: getSecondaryAccountLog()
  });
});

// --- Get primary hedge status ---
router.get('/v1/primary-hedge-status', (req, res) => {
  res.json(getPrimaryHedgeStatus());
});

// --- Get secondary hedge status ---
router.get('/v1/secondary-hedge-status', (req, res) => {
  res.json(getSecondaryHedgeStatus());
});

// --- Get secondary account log ---
router.get('/v1/secondary-log', (req, res) => {
  res.json(getSecondaryAccountLog());
});

export default router;
