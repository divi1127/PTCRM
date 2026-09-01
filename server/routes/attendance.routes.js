const express = require('express');
const router = express.Router();
const { getMyAttendance, getAllAttendance, checkIn, checkOut } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyAttendance);
router.get('/all', protect, adminOnly, getAllAttendance);
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

module.exports = router;