const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');

// @route   POST api/vault/deposit
router.post('/deposit', auth, async (req, res) => {
    const { amount } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });

        user.balance -= amount;
        user.vaultBalance += amount;
        await user.save();

        res.json({ message: 'Funds moved to Vault', balance: user.balance, vault: user.vaultBalance });
    } catch (err) {
        res.status(500).json({ message: 'Vault Error' });
    }
});

module.exports = router;
