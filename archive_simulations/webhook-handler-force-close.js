import express from "express";
import { 
  forceCloseAllHedges, 
  getPrimaryHedgeStatus, 
  getSecondaryHedgeStatus, 
  getSecondaryAccountLog 
} from "./trade-logic-multi-account.js";

const router = express.Router();

// --- Force close all open hedges ---
router.post("/v1/force-close-all", (req, res) => {
  const { marketPrices } = req.body || {}; // optional prices per symbol
  forceCloseAllHedges(marketPrices);       // function defined in trade-logic
  res.json({
    status: "ok",
    primaryHedgeStatus: getPrimaryHedgeStatus(),
    secondaryHedgeStatus: getSecondaryHedgeStatus(),
    secondaryAccountLog: getSecondaryAccountLog()
  });
});

export default router;
