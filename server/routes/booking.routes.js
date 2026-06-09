const express = require('express');
const router = express.Router();
const {
  getAllBookings, createBooking, getMyBookings, cancelBooking, confirmBooking, getAvailableSlots
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/slots', protect, getAvailableSlots);
router.get('/my', protect, getMyBookings);
router.get('/', protect, adminOnly, getAllBookings);
router.post('/', protect, createBooking);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/confirm', protect, adminOnly, confirmBooking);

module.exports = router;
