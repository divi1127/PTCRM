const Target = require('../models/Target');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logActivity = require('../utils/activityLogger');

// Helper to send a notification to an employee
const sendNotification = async (recipientId, type, title, message, link) => {
  try {
    await Notification.create({ recipient: recipientId, type, title, message, link });
  } catch (e) { console.error('[Notification] Failed to create:', e.message); }
};

const createTarget = async (req, res) => {
  try {
    const { employeeId, month, year, value, placeItems } = req.body;
    if (!employeeId || !month || !year || !value) {
      return res.status(400).json({ message: 'employeeId, month, year and value are required' });
    }

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const places = Array.isArray(placeItems) ? placeItems.map(item => ({
      placeName: item.placeName || 'Unnamed Place',
      address: item.address || '',
      status: 'Pending'
    })) : [];

    const target = await Target.create({
      employee: employee._id,
      month,
      year,
      value,
      places,
      status: 'Pending'
    });

    await logActivity(req.user._id, 'Create Target', `Assigned ${value} places to ${employee.name}`, target._id, 'Target');

    // Notify employee
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    await sendNotification(
      employee._id,
      'target_assigned',
      'New Target Assigned',
      `You have been assigned ${value} places for ${monthNames[month-1]} ${year}.`,
      '/employee/targets'
    );

    res.status(201).json(target);
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

    const targets = await Target.find(filter)
      .populate('employee', 'name email phone')
      .sort({ year: -1, month: -1, createdAt: -1 });

    const shaped = targets.map(target => {
      const completedPlaces = target.places.filter(place => place.status === 'Completed').length;
      const followUpPlaces  = target.places.filter(place => place.status === 'Follow Up').length;
      const totalPlaces = target.value || target.places.length || 0;
      const weeklyTarget = totalPlaces > 0 ? Math.ceil(totalPlaces / 4) : 0;
      return {
        ...target.toObject(),
        achieved: completedPlaces,
        followUp: followUpPlaces,
        value: totalPlaces,
        weeklyTarget,
        progress: totalPlaces > 0 ? Math.round((completedPlaces / totalPlaces) * 100) : 0,
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTargetPlace = async (req, res) => {
  try {
    const { id, placeId } = req.params;
    const { status, notes, selfie, photoUrl } = req.body;
    const target = await Target.findById(id);
    if (!target) return res.status(404).json({ message: 'Target not found' });

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && target.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this target' });
    }

    const place = target.places.id(placeId);
    if (!place) return res.status(404).json({ message: 'Place not found' });

    if (status) place.status = status;
    if (notes) place.notes = notes;
    if (selfie) place.selfie = selfie;
    if (photoUrl) place.photos = [...(place.photos || []), photoUrl];
    place.updatedAt = new Date();

    const completedPlaces = target.places.filter(p => p.status === 'Completed').length;
    target.achieved = completedPlaces;
    const total = target.value || target.places.length;
    target.status = completedPlaces === total ? 'Completed' : 'Pending';
    await target.save();

    await logActivity(req.user._id, 'Update Target Place', `Updated place ${place.placeName}`, target._id, 'Target');
    res.json(target);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getTargetById = async (req, res) => {
  try {
    const target = await Target.findById(req.params.id).populate('employee', 'name email phone');
    if (!target) return res.status(404).json({ message: 'Target not found' });
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && target.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const completedPlaces = target.places.filter(place => place.status === 'Completed').length;
    res.json({
      ...target.toObject(),
      achieved: completedPlaces,
      value: target.value || target.places.length || 0,
      progress: target.value > 0 ? Math.round((completedPlaces / target.value) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTarget = async (req, res) => {
  try {
    const { employeeId, month, year, value, placeItems } = req.body;
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Target not found' });
    if (employeeId) target.employee = employeeId;
    if (month) target.month = Number(month);
    if (year) target.year = Number(year);
    if (value) target.value = Number(value);
    if (Array.isArray(placeItems)) {
      target.places = placeItems.map(item => ({ placeName: item.placeName || 'Unnamed', address: item.address || '', rNo: item.rNo || '', status: 'Pending' }));
    }
    await target.save();

    // Notify employee about update
    const emp = await User.findById(target.employee).select('name');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    await sendNotification(
      target.employee,
      'target_assigned',
      'Target Updated',
      `Your target for ${monthNames[(target.month||1)-1]} ${target.year} has been updated.`,
      '/employee/targets'
    );

    res.json(target);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteTarget = async (req, res) => {
  try {
    await Target.findByIdAndDelete(req.params.id);
    res.json({ message: 'Target deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = { createTarget, getTargets, updateTargetPlace, getTargetById, updateTarget, deleteTarget };