const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const { verifyPaystack } = require('../features/payments');

router.post('/verify', auth, async (req, res) => {
    const { reference } = req.body;
    try {
        const data = await verifyPaystack(reference);
        if (data && data.status && data.data.status === 'success') {
            const amount = data.data.amount / 100; // Convert kobo to Naira
            const user = await User.findById(req.user.id);
            user.balance += amount;
            await user.save();
            return res.json({ message: 'Deposit successful', newBalance: user.balance });
        }
        res.status(400).json({ message: 'Payment verification failed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
