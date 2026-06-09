const express = require('express');
const router = express.Router();
const {
  getRevenue, getLeadsConversion, getBookingsBySport, getAgentPerformance,
  getDashboardKPIs, getSportsPlaceStats, getAttendanceRecords, getTargets, getEmployeeStats
} = require('../controllers/reportController');
const { protect, adminOnly, agentOrAdmin } = require('../middleware/authMiddleware');

router.get('/dashboard-kpis', protect, adminOnly, getDashboardKPIs);
router.get('/revenue', protect, adminOnly, getRevenue);
router.get('/leads-conversion', protect, adminOnly, getLeadsConversion);
router.get('/bookings-by-sport', protect, adminOnly, getBookingsBySport);
router.get('/agent-performance', protect, adminOnly, getAgentPerformance);
router.get('/sports-place-stats', protect, adminOnly, getSportsPlaceStats);
router.get('/attendance', protect, adminOnly, getAttendanceRecords);
router.get('/targets', protect, agentOrAdmin, getTargets);
router.get('/employee-stats', protect, getEmployeeStats);

module.exports = router;
