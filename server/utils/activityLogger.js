const ActivityLog = require('../models/ActivityLog');

const logActivity = async (userId, action, details, targetId = null, targetModel = null) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      details,
      targetId,
      targetModel
    });
  } catch (err) {
    console.error('Logging Error:', err);
  }
};

module.exports = logActivity;
