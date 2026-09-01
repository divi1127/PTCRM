/**
 * notifHelper.js
 * Centralised helper to create notifications without duplicating code.
 */
const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send a notification to one specific recipient.
 * @param {ObjectId|string} recipientId
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {string} [link]
 */
const notify = async (recipientId, type, title, message, link = '') => {
  try {
    await Notification.create({ recipient: recipientId, type, title, message, link });
  } catch (e) {
    console.error('[Notif] Failed to create notification:', e.message);
  }
};

/**
 * Send a notification to every admin user in the system.
 * @param {string} type
 * @param {string} title
 * @param {string} message
 * @param {string} [link]
 */
const notifyAllAdmins = async (type, title, message, link = '') => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (!admins.length) return;
    const docs = admins.map(a => ({
      recipient: a._id,
      type,
      title,
      message,
      link,
    }));
    await Notification.insertMany(docs, { ordered: false });
  } catch (e) {
    console.error('[Notif] Failed to notify admins:', e.message);
  }
};

module.exports = { notify, notifyAllAdmins };
