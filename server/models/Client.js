const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
  address: { type: String },
  sportsPlaceDetails: {
    name: { type: String },
    district: { type: String },
    type: { type: String } // e.g. Turf, Academy, Ground
  },
  paymentPlan: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly', 'One-time'],
    default: 'Monthly'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned manager
  history: [{
    action: String,
    date: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
