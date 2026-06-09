const express = require('express');
const router = express.Router();
const { protect, adminOnly, agentOrAdmin } = require('../middleware/authMiddleware');
const { getMeetings, createMeeting, updateMeeting, deleteMeeting, changeMeetingStatus } = require('../controllers/meetingController');

router.get('/', protect, agentOrAdmin, getMeetings);
router.post('/', protect, adminOnly, createMeeting);
router.put('/:id', protect, agentOrAdmin, updateMeeting);
router.delete('/:id', protect, adminOnly, deleteMeeting);
router.patch('/:id/status', protect, agentOrAdmin, changeMeetingStatus);

module.exports = router;