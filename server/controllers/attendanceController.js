const Attendance = require('../models/Attendance');
const logActivity = require('../utils/activityLogger');

const getMyAttendance = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const attendance = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: dayStart, $lt: dayEnd }
    });

    res.json(attendance || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkIn = async (req, res) => {
  try {
    const { location, selfie, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    if (existing && existing.checkIn?.time) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    const attendance = await Attendance.create({
      employee: req.user._id,
      date: today,
      checkIn: {
        time: new Date(),
        selfie,
        location: location || {}
      },
      workFrom: location ? 'Field' : 'Office',
      notes,
      status: 'Present'
    });

    await logActivity(req.user._id, 'Check In', `Checked in for attendance`, attendance._id, 'Attendance');
    res.status(201).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkOut = async (req, res) => {
  try {
    const { location, selfie, notes } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const record = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    if (!record || !record.checkIn?.time) {
      return res.status(404).json({ message: 'No active check-in found for today' });
    }

    if (record.checkOut?.time) {
      return res.status(400).json({ message: 'Already checked out for today' });
    }

    record.checkOut = {
      time: new Date(),
      selfie,
      location: location || {}
    };
    record.notes = notes || record.notes;
    await record.save();

    await logActivity(req.user._id, 'Check Out', `Checked out for attendance`, record._id, 'Attendance');
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyAttendance, checkIn, checkOut };