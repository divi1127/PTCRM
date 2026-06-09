const mongoose = require('mongoose');

const sportsPlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String, required: true, index: true },
  address: { type: String },
  contactPerson: { type: String },
  phone: { type: String },
  sno: { type: String, trim: true },
  category: { type: String, trim: true },
  contactAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
  source: { type: String, enum: ['excel_import', 'manual'], default: 'excel_import' },
  importBatch: { type: String, index: true },
  type: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { timestamps: true });

sportsPlaceSchema.index({ phone: 1 }, { sparse: true });
sportsPlaceSchema.index({ sno: 1 }, { sparse: true });

module.exports = mongoose.model('SportsPlace', sportsPlaceSchema);
