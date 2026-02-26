const express = require('express');
const router = express.Router();
const auth = require('../utils/authMiddleware');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { verifyPaystackPayment } = require('../features/payments');

// @route   POST api/payment/verify
// @desc    Verify Paystack transaction and credit user balance
router.post('/verify', auth, async (req, res) => {
    const { reference } = req.body;

    try {
        // 1. Check if transaction already processed
        const existingTx = await Transaction.findOne({ reference });
        if (existingTx) return res.status(400).json({ message: 'Transaction already processed' });

        // 2. Verify with Paystack
        const paystackData = await verifyPaystackPayment(reference);

        if (paystackData && paystackData.status === true && paystackData.data.status === 'success') {
            const amountInNaira = paystackData.data.amount / 100; // Paystack sends in Kobo
            
            // 3. Update User Balance
            const user = await User.findById(req.user.id);
            user.balance += amountInNaira;
            await user.save();

            // 4. Log Transaction
            const newTx = new Transaction({
                userId: req.user.id,
                type: 'deposit',
                amount: amountInNaira,
                status: 'completed',
                reference: reference,
                metadata: paystackData.data
            });
            await newTx.save();

            return res.json({ 
                status: 'success', 
                newBalance: user.balance, 
                message: 'Deposit successful!' 
            });
        } else {
            return res.status(400).json({ message: 'Payment verification failed' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Payment processing error' });
    }
});

module.exports = router;
