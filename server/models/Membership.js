const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  points: { type: Number, default: 0 },
  referralCode: { type: String, unique: true },
  discount: { type: Number, default: 0 },
  price: { type: Number },
  autoRenew: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Membership', membershipSchema);
