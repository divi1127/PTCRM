const User = require('../models/User');
const Membership = require('../models/Membership');

// @desc Get all users (admin)
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update user
const updateUser = async (req, res) => {
  try {
    const { name, phone, role, isActive, facePhoto } = req.body;
    const updates = { name, phone, role, isActive };
    if (facePhoto !== undefined) updates.facePhoto = facePhoto;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Update own profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get membership
const getMembership = async (req, res) => {
  try {
    const membership = await Membership.findOne({ user: req.user._id, status: 'active' });
    res.json(membership);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Create membership
const createMembership = async (req, res) => {
  try {
    const { plan } = req.body;
    const planPrices = { monthly: 999, quarterly: 2499, yearly: 7999 };
    const durations = { monthly: 30, quarterly: 90, yearly: 365 };
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durations[plan] * 86400000);
    const referralCode = `PT${req.user._id.toString().slice(-6).toUpperCase()}`;

    const membership = await Membership.create({
      user: req.user._id,
      plan,
      startDate,
      endDate,
      price: planPrices[plan],
      referralCode,
      status: 'active',
    });
    res.status(201).json(membership);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Delete a user (admin only, cannot delete self)
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Reset a user's password (admin only)
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = newPassword; // pre-save hook will hash it
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, updateProfile, getMembership, createMembership, deleteUser, resetPassword };

