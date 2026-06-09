const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sport: {
    type: String,
    enum: ['football', 'cricket', 'badminton', 'basketball', 'other'],
    required: true,
  },
  venue: { type: String, required: true },
  slot: {
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  amount: { type: Number, required: true },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  },
  paymentId: { type: String },
  invoiceUrl: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
