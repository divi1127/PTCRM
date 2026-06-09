const Meeting = require('../models/Meeting');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');

const getMeetings = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'employee' || req.user.role === 'agent') {
      filter.employee = req.user._id;
    }
    const meetings = await Meeting.find(filter)
      .populate('employee', 'name email phone')
      .populate('lead', 'name phone sno sportsPlaceName')
      .populate('client', 'name phone')
      .sort({ scheduledAt: 1 });
    res.json(meetings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { title, description, type, scheduledAt, employeeId, leadId, clientId } = req.body;
    const assignedEmployee = employeeId || req.user._id;
    const employee = await User.findById(assignedEmployee);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const meeting = await Meeting.create({
      title,
      description,
      type,
      scheduledAt,
      employee: employee._id,
      lead: leadId,
      client: clientId,
      status: 'Scheduled'
    });

    await logActivity(req.user._id, 'Create Meeting', `Scheduled meeting for ${employee.name}`, meeting._id, 'Meeting');
    res.status(201).json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && meeting.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this meeting' });
    }

    const updates = { ...req.body };
    const updatedMeeting = await Meeting.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    await logActivity(req.user._id, 'Update Meeting', `Updated meeting ${updatedMeeting.title}`, updatedMeeting._id, 'Meeting');
    res.json(updatedMeeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const changeMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && meeting.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to change this meeting status' });
    }

    meeting.status = status;
    await meeting.save();
    await logActivity(req.user._id, 'Change Meeting Status', `Status → ${status}`, meeting._id, 'Meeting');
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meeting deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { getMeetings, createMeeting, updateMeeting, deleteMeeting, changeMeetingStatus };