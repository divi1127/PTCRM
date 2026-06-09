const mongoose = require('mongoose');

const importHistorySchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  sourceFileName: { type: String, default: 'Excel Import' },
  sourceType: { type: String, enum: ['upload', 'upload-master', 'auto-sync'], default: 'upload' },
  totalRows: { type: Number, default: 0 },
  imported: { type: Number, default: 0 },
  duplicates: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  districts: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ImportHistory', importHistorySchema);
