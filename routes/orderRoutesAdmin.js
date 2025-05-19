
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware');

// Các route yêu cầu xác thực
router.put('/:id', authMiddleware, orderController.updateOrderStatus); // Cập nhật trạng thái đơn hàng
router.get('/:orderId', orderController.getOrderDetails); // Get order details by orderId
router.get('/', orderController.getOrders);
module.exports = router;
