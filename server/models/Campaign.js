const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['whatsapp', 'sms', 'email', 'flyer'],
    required: true,
  },
  targetArea: { type: String },
  targetSport: {
    type: String,
    enum: ['football', 'cricket', 'badminton', 'basketball', 'other', 'all'],
    default: 'all',
  },
  launchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'paused'],
    default: 'draft',
  },
  budget: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  scheduledAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
