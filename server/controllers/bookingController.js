const Booking = require('../models/Booking');

// @desc Get all bookings (admin)
const getAllBookings = async (req, res) => {
  try {
    const { sport, status, date } = req.query;
    const filter = {};
    if (sport) filter.sport = sport;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter['slot.date'] = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Create booking
const createBooking = async (req, res) => {
  try {
    const booking = await Booking.create({ ...req.body, user: req.user._id });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get user's bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'cancelled';
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Confirm booking (admin)
const confirmBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', paymentStatus: 'paid' },
      { new: true }
    );
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Get available slots
const getAvailableSlots = async (req, res) => {
  try {
    const { date, sport, venue } = req.query;
    const allSlots = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00'];

    const d = new Date(date);
    const booked = await Booking.find({
      sport, venue,
      'slot.date': { $gte: d, $lt: new Date(d.getTime() + 86400000) },
      status: { $ne: 'cancelled' },
    });

    const bookedSlots = booked.map(b => b.slot.startTime);
    const available = allSlots.filter(s => !bookedSlots.includes(s));
    res.json({ available, bookedSlots });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllBookings, createBooking, getMyBookings, cancelBooking, confirmBooking, getAvailableSlots };
