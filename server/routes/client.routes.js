const express = require('express');
const router = express.Router();
const { getClients, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getClients);
router.post('/', protect, adminOnly, createClient);
router.put('/:id', protect, adminOnly, updateClient);
router.delete('/:id', protect, adminOnly, deleteClient);

module.exports = router;
