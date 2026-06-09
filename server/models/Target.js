const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: Number, required: true }, // 1-12
  year: { type: Number, required: true },
  type: {
    type: String,
    enum: ['Monthly', 'Daily'],
    default: 'Monthly'
  },
  value: { type: Number, default: 0 },
  achieved: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  places: [{
    placeName: { type: String, required: true },
    address: { type: String },
    rNo: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number }
    },
    status: {
      type: String,
      enum: ['Pending', 'Follow Up', 'Completed'],
      default: 'Pending'
    },
    selfie: { type: String },
    photos: [{ type: String }],
    notes: { type: String },
    updatedAt: { type: Date }
  }],
  metrics: {
    leads: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    calls: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Target', targetSchema);
