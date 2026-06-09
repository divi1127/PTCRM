const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['Online', 'Offline', 'Call'],
    default: 'Offline'
  },
  scheduledAt: { type: Date, required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  notes: { type: String },
  status: {
    type: String,
    enum: ['Scheduled', 'Proceeding', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  recordingUrl: { type: String } // For voice/camera meetings
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
