const express = require('express');
const router = express.Router();
const { getMyAttendance, checkIn, checkOut } = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMyAttendance);
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);

module.exports = router;