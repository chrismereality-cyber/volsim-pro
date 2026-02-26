const User = require('../models/User');
const Transaction = require('../models/User'); // We'll use this for history

const executeTrade = async (userId, type, amount, result) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        // Logic: result is 1 for win, -1 for loss
        const profitLoss = type === 'win' ? amount * 0.95 : -amount; // 95% payout example
        
        user.balance += profitLoss;
        await user.save();

        return { newBalance: user.balance, profitLoss };
    } catch (err) {
        console.error('Trade Execution Error:', err);
    }
};

module.exports = { executeTrade };
