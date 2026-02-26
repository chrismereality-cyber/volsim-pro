const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'trade', 'vault_transfer'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  reference: { type: String, unique: true },
  bankDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
