const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  vaultBalance: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  role: { type: String, default: 'user' }, // user, admin, beta
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
