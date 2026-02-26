const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const { executeTrade } = require('../engine/trading');
const { generateSignal } = require('../engine/ai');
const { checkRisk } = require('../engine/hedge');

router.post('/run', auth, async (req, res) => {
    try {
        const { stake, strategy } = req.body;
        const user = await User.findById(req.user.id);
        
        const riskStatus = checkRisk(user.balance, stake, []); 
        if (riskStatus.action === 'block') {
            return res.status(403).json({ message: riskStatus.message });
        }

        // Generate Signal with Market Context
        const aiDecision = generateSignal(strategy || 'normal', []);

        // Execute Trade
        const tradeResult = await executeTrade(user._id, aiDecision.outcome, stake);

        res.json({
            status: 'success',
            outcome: aiDecision.outcome,
            market: aiDecision.marketContext,
            aiConfidence: aiDecision.confidence,
            newBalance: tradeResult.newBalance,
            change: tradeResult.profitLoss,
            hedgeActive: riskStatus.action === 'hedge'
        });

    } catch (err) {
        res.status(500).json({ message: 'Market Engine Error' });
    }
});

module.exports = router;
