const Meeting = require('../models/Meeting');
const User = require('../models/User');
const logActivity = require('../utils/activityLogger');
const { notify, notifyAllAdmins } = require('../utils/notifHelper');

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

    // Notify the assigned employee (only if admin scheduled it for someone else)
    if (employee._id.toString() !== req.user._id.toString()) {
      const dateStr = scheduledAt
        ? new Date(scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : 'TBD';
      await notify(
        employee._id,
        'meeting_scheduled',
        '📅 Meeting Scheduled for You',
        `A meeting "${title}" has been scheduled for you on ${dateStr}.`,
        '/employee/meetings'
      );
    }

    // Notify all admins about the meeting (both when admin schedules for employee and when employee self-schedules)
    await notifyAllAdmins(
      'meeting_scheduled',
      '📅 New Meeting Scheduled',
      `${req.user.name} scheduled a meeting for ${employee.name}: "${title}".`,
      '/admin/meetings'
    );

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

    // Notify admins when an employee marks a meeting status
    if (req.user.role !== 'admin') {
      await notifyAllAdmins(
        'meeting_updated',
        '📋 Meeting Status Updated',
        `${req.user.name} marked meeting "${meeting.title}" as ${status}.`,
        '/admin/meetings'
      );
    }

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