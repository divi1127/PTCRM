const mongoose = require('mongoose');

const fieldVisitSchema = new mongoose.Schema({
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  checkIn: {
    time: { type: Date },
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },
  checkOut: {
    time: { type: Date },
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
  },
  notes: { type: String },
  photosUploaded: [{ type: String }],
  reportSubmitted: { type: Boolean, default: false },
  dailyReport: { type: String },
  leadsAdded: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['checked-in', 'checked-out'],
    default: 'checked-in',
  },
}, { timestamps: true });

module.exports = mongoose.model('FieldVisit', fieldVisitSchema);
