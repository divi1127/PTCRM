const express = require('express');
const router = express.Router();
const {
  getProducts, addProduct, updateProduct, deleteProduct, placeOrder, getMyOrders, getAllOrders
} = require('../controllers/shopController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/products', protect, getProducts);
router.post('/products', protect, adminOnly, addProduct);
router.put('/products/:id', protect, adminOnly, updateProduct);
router.delete('/products/:id', protect, adminOnly, deleteProduct);
router.post('/order', protect, placeOrder);
router.get('/orders/my', protect, getMyOrders);
router.get('/orders', protect, adminOnly, getAllOrders);

module.exports = router;
