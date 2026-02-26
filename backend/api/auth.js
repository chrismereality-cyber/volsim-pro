const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');
const { processReferralBonus } = require('../features/community');

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const personalReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    user = new User({
      username,
      email,
      password: hashedPassword,
      referralCode: personalReferralCode,
      referredBy: referralCode || null,
      balance: 1000 
    });

    await user.save();

    // Trigger Referral Bonus if a code was used
    if (referralCode) {
        await processReferralBonus(referralCode, user._id);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username, balance: user.balance, referralCode: personalReferralCode } });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, balance: user.balance, referralCode: user.referralCode } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
