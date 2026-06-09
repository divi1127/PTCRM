const express = require('express');
const router  = express.Router();
const {
  getLeads, createLead, updateLead, deleteLead, deleteAllLeads,
  convertLead, getLeadStats,
  getDistricts, getPlacesByDistrict, getAllLocations,
  bulkAssign,
} = require('../controllers/leadController');
const { protect, adminOnly, agentOrAdmin } = require('../middleware/authMiddleware');

// Stats & helpers first (before /:id to avoid conflicts)
router.get('/stats',              protect, agentOrAdmin, getLeadStats);
router.get('/districts',          protect, agentOrAdmin, getDistricts);
router.get('/locations',          protect, agentOrAdmin, getAllLocations);
router.get('/places/:district',   protect, agentOrAdmin, getPlacesByDistrict);
router.post('/bulk-assign',       protect, adminOnly,    bulkAssign);
router.delete('/delete-all',      protect, adminOnly,    deleteAllLeads);

// CRUD
router.get('/',        protect, agentOrAdmin, getLeads);
router.post('/',       protect, agentOrAdmin, createLead);
router.put('/:id',     protect, agentOrAdmin, updateLead);
router.delete('/:id',  protect, adminOnly,    deleteLead);
router.post('/:id/convert', protect, agentOrAdmin, convertLead);

module.exports = router;
