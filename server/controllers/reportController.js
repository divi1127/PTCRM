const Booking = require('../models/Booking');
const Lead = require('../models/Lead');
const User = require('../models/User');
const FieldVisit = require('../models/FieldVisit');
const Campaign = require('../models/Campaign');
const Attendance = require('../models/Attendance');
const Meeting = require('../models/Meeting');
const Payment = require('../models/Payment');
const Client = require('../models/Client');

// @desc Revenue summary
const getRevenue = async (req, res) => {
  try {
    const totalRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

    res.json({
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue,
      totalBookings,
      confirmedBookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Lead conversion stats
const getLeadsConversion = async (req, res) => {
  try {
    const byStatus = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const bySource = await Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);
    const totalLeads = await Lead.countDocuments();
    const convertedLeads = await Lead.countDocuments({ status: 'converted' });
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    res.json({ byStatus, bySource, totalLeads, convertedLeads, conversionRate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Bookings grouped by sport
const getBookingsBySport = async (req, res) => {
  try {
    const data = await Booking.aggregate([
      { $group: { _id: '$sport', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Agent performance leaderboard
const getAgentPerformance = async (req, res) => {
  try {
    const agents = await User.find({ role: 'agent' });
    const performance = await Promise.all(agents.map(async (agent) => {
      const leadsCount = await Lead.countDocuments({ assignedTo: agent._id });
      const convertedCount = await Lead.countDocuments({ assignedTo: agent._id, status: 'converted' });
      const visitsCount = await FieldVisit.countDocuments({ agent: agent._id });
      return {
        agent: { _id: agent._id, name: agent.name, email: agent.email },
        leadsCount,
        convertedCount,
        visitsCount,
        conversionRate: leadsCount > 0 ? ((convertedCount / leadsCount) * 100).toFixed(1) : 0,
      };
    }));
    performance.sort((a, b) => b.convertedCount - a.convertedCount);
    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Dashboard KPIs
const getDashboardKPIs = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const totalCustomers = await Client.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const presentToday = await Attendance.countDocuments({ date: { $gte: todayStart }, status: 'Present' });
    const todayAttendance = `${presentToday}/${totalEmployees}`;

    const revenueData = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const pendingData = await Payment.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const upcomingMeetings = await Meeting.countDocuments({ scheduledAt: { $gte: new Date() }, status: 'Scheduled' });
    const upcomingFollowUps = await Lead.countDocuments({ followUpDate: { $gte: new Date() }, status: { $ne: 'Closed' } });

    res.json({
      totalLeads,
      totalCustomers,
      totalEmployees,
      totalRevenue: revenueData[0]?.total || 0,
      pendingPayments: pendingData[0]?.total || 0,
      todayAttendance,
      upcomingMeetings,
      upcomingFollowUps,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Sports Place stats (category & district)
const getSportsPlaceStats = async (req, res) => {
  try {
    const byDistrict = await Lead.aggregate([
      { $match: { district: { $exists: true, $ne: '' } } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byCategory = await Lead.aggregate([
      { $match: { category: { $exists: true, $ne: '' } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ byDistrict, byCategory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Attendance records by date
const getAttendanceRecords = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 86400000);

    const records = await Attendance.find({
      date: { $gte: dayStart, $lt: dayEnd }
    })
      .populate('employee', 'name email phone')
      .sort({ createdAt: -1 });

    const shaped = records.map(record => ({
      _id: record._id,
      user: record.employee,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      location: record.checkIn?.location || record.checkOut?.location || {},
      status: record.status,
      workFrom: record.workFrom,
      notes: record.notes,
    }));

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTargets = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      filter.employee = req.user._id;
    }
    if (req.query.month) filter.month = Number(req.query.month);
    if (req.query.year) filter.year = Number(req.query.year);

    const targets = await require('../models/Target').find(filter)
      .populate('employee', 'name email phone')
      .sort({ year: -1, month: -1, createdAt: -1 });

    const shaped = targets.map(target => {
      const completedPlaces = target.places.filter(place => place.status === 'Completed').length;
      const totalPlaces = target.value || target.places.length || 0;
      return {
        ...target.toObject(),
        achieved: completedPlaces,
        value: totalPlaces,
        progress: totalPlaces > 0 ? Math.round((completedPlaces / totalPlaces) * 100) : 0,
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    // My Leads
    const leadsCount = await Lead.countDocuments({ assignedTo: userId });

    // Today Meetings
    const todayMeetingsCount = await Meeting.countDocuments({ 
      $or: [{ employee: userId }, { employeeId: userId }],  // handle diverse schemas if needed
      scheduledAt: { $gte: todayStart, $lt: todayEnd } 
    });

    // Attendance
    const todayAttendance = await Attendance.findOne({ employee: userId, date: { $gte: todayStart, $lt: todayEnd } });
    let attendanceText = 'Not Marked';
    if (todayAttendance?.checkIn?.time) {
      attendanceText = new Date(todayAttendance.checkIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Monthly Target Progress
    const Target = require('../models/Target');
    const currentTarget = await Target.findOne({ employee: userId, month: now.getMonth() + 1, year: now.getFullYear() });
    let targetProgress = 0;
    if (currentTarget) {
      const completedPlaces = currentTarget.places.filter(place => place.status === 'Completed').length;
      const totalPlaces = currentTarget.value || currentTarget.places.length || 0;
      targetProgress = totalPlaces > 0 ? Math.round((completedPlaces / totalPlaces) * 100) : 0;
    }

    // Upcoming Follow-ups
    const upcomingFollowUps = await Lead.find({
      assignedTo: userId,
      followUpDate: { $gte: todayStart },
      status: { $nin: ['Converted', 'Closed'] }
    }).sort({ followUpDate: 1 }).limit(5).select('name phone followUpDate status');

    res.json({
      leads: leadsCount,
      meetings: todayMeetingsCount,
      attendance: attendanceText,
      targetProgress: targetProgress,
      upcomingFollowUps: upcomingFollowUps
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getRevenue, getLeadsConversion, getBookingsBySport, getAgentPerformance, getDashboardKPIs, getSportsPlaceStats, getAttendanceRecords, getTargets, getEmployeeStats };
