const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @route   GET api/admin/withdrawals
// @desc    View all pending withdrawals
router.get('/withdrawals', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });

        const pending = await Transaction.find({ type: 'withdrawal', status: 'pending' })
                                         .populate('userId', 'username email');
        res.json(pending);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// @route   POST api/admin/approve-withdrawal
router.post('/approve-withdrawal', auth, async (req, res) => {
    const { transactionId } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') return res.status(403).json({ message: 'Access Denied' });

        const tx = await Transaction.findById(transactionId);
        tx.status = 'completed';
        await tx.save();

        res.json({ message: 'Withdrawal marked as completed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
