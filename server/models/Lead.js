const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },

  sno:   { type: String, trim: true }, // Serial number from Excel
  sportsPlaceName: { type: String, trim: true },
  district:        { type: String, trim: true, index: true },
  category:        { type: String, trim: true },

  source: {
    type: String,
    enum: ['field', 'web', 'social', 'referral', 'excel_import'],
    default: 'field',
  },
  status: {
    type: String,
    // Active statuses + legacy values for existing data
    enum: ['New Lead', 'Follow Up', 'Follow-up', 'Demo Scheduled', 'Conversion', 'Converted', 'Closed',
           'New', 'Interested', 'Demo', 'Rejected'],
    default: 'New Lead',
  },
  contactAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },

  leadType: { type: String, enum: ['Online', 'Offline'], default: 'Offline' },
  sport:    {
    type: String,
    enum: ['football', 'cricket', 'badminton', 'basketball', 'other'],
    default: 'other',
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },

  notes: { type: String },
  telecallingNotes: [{
    note: String,
    date: { type: Date, default: Date.now },
    by:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  location: {
    lat:     { type: Number },
    lng:     { type: Number },
    address: { type: String },
  },

  importBatch:     { type: String, index: true },
  followUpDate:    { type: Date },
  lastFollowUpDate:{ type: Date },
  convertedAt:     { type: Date },
}, { timestamps: true });

// Compound text index for fast search across name, place, district, phone
leadSchema.index({ name: 'text', sportsPlaceName: 'text', district: 'text', phone: 'text' });
leadSchema.index({ sno: 1 }, { sparse: true });

module.exports = mongoose.model('Lead', leadSchema);
