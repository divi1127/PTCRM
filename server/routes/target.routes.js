const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, adminOnly, agentOrAdmin } = require('../middleware/authMiddleware');
const { createTarget, getTargets, updateTargetPlace, getTargetById, updateTarget, deleteTarget } = require('../controllers/targetController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/targets'));
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, fileName);
  }
});
const upload = multer({ storage });

router.get('/', protect, agentOrAdmin, getTargets);
router.get('/:id', protect, agentOrAdmin, getTargetById);
router.post('/', protect, adminOnly, createTarget);
router.put('/:id', protect, adminOnly, updateTarget);
router.delete('/:id', protect, adminOnly, deleteTarget);
router.patch('/:id/place/:placeId', protect, agentOrAdmin, updateTargetPlace);
router.post('/:id/place/:placeId/photo', protect, agentOrAdmin, upload.single('photo'), async (req, res) => {
  try {
    const { id, placeId } = req.params;
    const target = await require('../models/Target').findById(id);
    if (!target) return res.status(404).json({ message: 'Target not found' });
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && target.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const place = target.places.id(placeId);
    if (!place) return res.status(404).json({ message: 'Place not found' });
    if (!req.file) return res.status(400).json({ message: 'Photo file missing' });

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/targets/${req.file.filename}`;
    place.photos = [...(place.photos || []), photoUrl];
    place.updatedAt = new Date();
    await target.save();

    res.json(target);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;