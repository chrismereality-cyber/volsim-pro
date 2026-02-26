const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

router.post('/request', auth, async (req, res) => {
    const { amount, bankName, accountNumber, accountName } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

        // 1. Deduct from balance immediately to prevent double spending
        user.balance -= amount;
        await user.save();

        // 2. Create Pending Transaction record
        const withdrawal = new Transaction({
            userId: req.user.id,
            type: 'withdrawal',
            amount: amount,
            status: 'pending',
            reference: 'WITH-' + Date.now(),
            bankDetails: { bankName, accountNumber, accountName }
        });

        await withdrawal.save();
        res.json({ message: 'Withdrawal request submitted', newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ message: 'Withdrawal Error' });
    }
});

module.exports = router;
