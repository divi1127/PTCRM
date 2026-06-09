const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'superadmin') return next();
  res.status(403).json({ message: 'Admin access only' });
};

const agentOrAdmin = (req, res, next) => {
  const allowed = ['admin', 'superadmin', 'agent', 'employee'];
  if (allowed.includes(req.user?.role)) return next();
  res.status(403).json({ message: 'Agent or Admin access only' });
};

module.exports = { protect, adminOnly, agentOrAdmin };
