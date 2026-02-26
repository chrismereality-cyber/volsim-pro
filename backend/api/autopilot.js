const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const { generateSignal } = require('../engine/ai');

router.post('/run', auth, async (req, res) => {
    try {
        const { stake, strategy } = req.body;
        const user = await User.findById(req.user.id);

        if (user.balance < stake) return res.status(400).json({ message: 'Insufficient Balance' });

        const result = generateSignal(strategy);
        
        if (result.outcome === 'win') {
            user.balance += (stake * 0.9); // 90% profit
        } else {
            user.balance -= stake;
        }

        await user.save();
        res.json({ newBalance: user.balance, market: result.market });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
