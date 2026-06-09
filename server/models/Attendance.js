const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: {
    time: { type: Date },
    selfie: { type: String }, // URL to image
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    }
  },
  checkOut: {
    time: { type: Date },
    selfie: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String }
    }
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-day'],
    default: 'Present'
  },
  workFrom: { type: String, enum: ['Field', 'Office', 'Remote'], default: 'Field' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
