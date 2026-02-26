const User = require('../models/User');

const processReferralBonus = async (referrerCode, newUserId) => {
    try {
        const referrer = await User.findOne({ referralCode: referrerCode });
        if (referrer) {
            // Reward the referrer with 500 Naira (Demo Bonus)
            referrer.balance += 500;
            await referrer.save();
            console.log('Referral bonus credited to: ' + referrer.username);
        }
    } catch (err) {
        console.error('Referral Processing Error:', err);
    }
};

module.exports = { processReferralBonus };
