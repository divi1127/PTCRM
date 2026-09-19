const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Helper: Check if current time in IST is after 6:00 PM (18:00) or before 6:00 AM
const isAfterWorkHours = () => {
  try {
    const istTimeStr = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
    const [hours] = istTimeStr.split(':').map(Number);
    // Work hours are 6:00 AM to 6:00 PM (18:00). After 18:00 (6:00 PM) until 06:00 AM, auto-logout is active and logins are blocked.
    return hours >= 18 || hours < 6;
  } catch {
    // Fallback using UTC+5:30 offset
    const now = new Date();
    const istHours = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    return istHours >= 18 || istHours < 6;
  }
};

// @desc Register new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role, facePhoto } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, phone, role: role || 'employee', facePhoto: facePhoto || '' });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Daily auto-logout check: After 6:00 PM, employee login is prohibited until 6:00 AM
    if (user.role?.toLowerCase() !== 'admin') {
      if (isAfterWorkHours()) {
        return res.status(403).json({
          message: 'Work hours ended. Daily auto-logout took place at 6:00 PM. Login is restricted until 6:00 AM tomorrow.',
          isAfterHours: true
        });
      }
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto,
      phone: user.phone,
      walletBalance: user.walletBalance,
      rewardPoints: user.rewardPoints,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get current user profile
const getMe = async (req, res) => {
  if (req.user && req.user.role?.toLowerCase() !== 'admin') {
    if (isAfterWorkHours()) {
      return res.status(403).json({
        message: 'Daily shift ended at 6:00 PM. Auto-logout is active.',
        isAfterHours: true
      });
    }
  }
  res.json(req.user);
};

// @desc Face login — match submitted photo against stored facePhoto
const faceLogin = async (req, res) => {
  try {
    const { facePhoto } = req.body;
    if (!facePhoto) return res.status(400).json({ message: 'No face photo provided' });
    // Find users who have a registered face
    const users = await User.find({ facePhoto: { $exists: true, $ne: '' } });
    if (users.length === 0) return res.status(401).json({ message: 'No face registered. Use email/password.' });
    // Simple similarity: compare first 200 chars of base64 as fingerprint
    const submitted = facePhoto.replace(/^data:image\/\w+;base64,/, '').substring(0, 200);
    const matched = users.find(u => {
      const stored = (u.facePhoto || '').replace(/^data:image\/\w+;base64,/, '').substring(0, 200);
      return stored.length > 50 && submitted.length > 50 && stored.substring(0, 80) === submitted.substring(0, 80);
    });
    if (!matched) return res.status(401).json({ message: 'Face not recognised. Try email/password.' });
    if (!matched.isActive) return res.status(403).json({ message: 'Account is inactive.' });

    // Daily auto-logout check: After 6:00 PM, employee login is prohibited
    if (matched.role?.toLowerCase() !== 'admin') {
      if (isAfterWorkHours()) {
        return res.status(403).json({
          message: 'Work hours ended. Daily auto-logout took place at 6:00 PM. Login is restricted until 6:00 AM tomorrow.',
          isAfterHours: true
        });
      }
    }

    res.json({
      _id: matched._id, name: matched.name, email: matched.email,
      role: matched.role, profilePhoto: matched.profilePhoto,
      phone: matched.phone, token: generateToken(matched._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { registerUser, loginUser, getMe, faceLogin, isAfterWorkHours };
