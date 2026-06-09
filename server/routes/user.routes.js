const express = require('express');
const router = express.Router();
const {
  getUsers, getUserById, updateUser, updateProfile, getMembership, createMembership,
  deleteUser, resetPassword
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getUsers);
router.get('/profile', protect, updateProfile);
router.put('/profile', protect, updateProfile);
router.get('/membership', protect, getMembership);
router.post('/membership', protect, createMembership);
router.get('/:id', protect, adminOnly, getUserById);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);
router.patch('/:id/reset-password', protect, adminOnly, resetPassword);

module.exports = router;

