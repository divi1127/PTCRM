const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },

  sportsPlaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'SportsPlace', index: true },
  sno:   { type: String, trim: true }, // Serial number from Excel
  sportsPlaceName: { type: String, trim: true },
  district:        { type: String, trim: true, index: true },
  category:        { type: String, trim: true },

  contactPerson:   { type: String, trim: true },
  contactRole:     { type: String, trim: true },
  alternatePhone:  { type: String, trim: true },
  clientRequirement:{ type: String, trim: true },
  clientResponse:  { type: String, trim: true },
  interestLevel:   { type: String, enum: ['High', 'Medium', 'Low', 'Not Interested'], default: 'Medium' },

  source: {
    type: String,
    enum: ['field', 'web', 'social', 'referral', 'excel_import'],
    default: 'field',
  },
  status: {
    type: String,
    enum: ['New Lead', 'Contacted', 'Interested', 'Follow Up', 'Follow-up', 'Demo Scheduled', 'Demo Online', 'Demo Offline', 'Negotiation', 'Conversion', 'Converted', 'Not Interested', 'Wrong Number', 'Lost', 'Closed', 'New', 'Demo', 'Rejected'],
    default: 'New Lead',
  },
  contactAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },

  leadType: { type: String, enum: ['Online', 'Offline', 'Field Visit'], default: 'Offline' },
  sport:    {
    type: String,
    enum: ['football', 'cricket', 'badminton', 'basketball', 'other'],
    default: 'other',
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  visitedAt:  { type: Date },

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
