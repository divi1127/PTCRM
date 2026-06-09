const express = require('express');
const router = express.Router();
const {
  createCampaign, getCampaigns, updateCampaign, checkIn, checkOut, getVisits
} = require('../controllers/marketingController');
const { protect, adminOnly, agentOrAdmin } = require('../middleware/authMiddleware');

router.post('/campaign', protect, agentOrAdmin, createCampaign);
router.get('/campaigns', protect, agentOrAdmin, getCampaigns);
router.put('/campaign/:id', protect, adminOnly, updateCampaign);
router.post('/visit/checkin', protect, agentOrAdmin, checkIn);
router.post('/visit/checkout', protect, agentOrAdmin, checkOut);
router.get('/visits', protect, agentOrAdmin, getVisits);

module.exports = router;
