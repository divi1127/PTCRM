const Attendance = require('../models/Attendance');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');
const { notifyAllAdmins } = require('../utils/notifHelper');

// Helper: Auto-close past days attendance records that missed checkout (e.g. yesterday 18/09)
const autoCloseAttendanceRecords = async (employeeId = null) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const pastQuery = {
      date: { $lt: todayStart },
      'checkIn.time': { $exists: true, $ne: null },
      $or: [{ 'checkOut.time': { $exists: false } }, { 'checkOut.time': null }]
    };
    if (employeeId) pastQuery.employee = employeeId;

    const unclosedPast = await Attendance.find(pastQuery);
    for (const record of unclosedPast) {
      const closeTime = new Date(record.date);
      closeTime.setHours(18, 0, 0, 0);
      record.checkOut = {
        time: closeTime,
        location: record.checkIn?.location || { address: 'Manual / System Closed' }
      };
      await record.save();
    }
  } catch (err) {
    console.error('Error in autoCloseAttendanceRecords:', err);
  }
};

const getMyAttendance = async (req, res) => {
  try {
    // Auto-close past days or after-6pm attendance if needed
    await autoCloseAttendanceRecords(req.user._id);

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

// Get all attendance records (admin only)
const getAllAttendance = async (req, res) => {
  try {
    // Auto-close past unclosed attendance
    await autoCloseAttendanceRecords();

    const { date, employeeId, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      filter.date = { $gte: dayStart, $lt: dayEnd };
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [attendance, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'name email phone')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Attendance.countDocuments(filter)
    ]);

    res.json({ attendance, total, page: pageNum, pages: Math.ceil(total / pageSize) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const checkIn = async (req, res) => {
  try {
    const { location, selfie, notes } = req.body;
    // Auto-close past days (e.g. yesterday) if not checked out
    await autoCloseAttendanceRecords(req.user._id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await Attendance.findOne({
      employee: req.user._id,
      date: { $gte: today, $lt: new Date(today.getTime() + 86400000) }
    });

    if (existing && existing.checkIn?.time) {
      return res.status(200).json({ message: 'Already checked in for today', alreadyCheckedIn: true, attendance: existing });
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

    // Notify all admins
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    await notifyAllAdmins(
      'attendance_checkin',
      '✅ Employee Checked In',
      `${req.user.name} checked in at ${timeStr}.`,
      '/admin/attendance'
    );

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

    // Notify all admins
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    await notifyAllAdmins(
      'attendance_checkout',
      '🔚 Employee Checked Out',
      `${req.user.name} checked out at ${timeStr}.`,
      '/admin/attendance'
    );

    res.json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMyAttendance, getAllAttendance, checkIn, checkOut };