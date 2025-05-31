const express = require('express');
const router = express.Router();
const {getSupportQueue,removeFromQueue} = require('../controllers/supportQueueController');
const { authMiddleware, verifyAnyUser} = require('../middleware/authMiddleware');

// Chỉ nhân viên mới được xem toàn bộ hàng chờ
router.get('/', authMiddleware, getSupportQueue);

// Xóa khách khỏi hàng chờ theo customerId
router.delete('/:customerId',verifyAnyUser, removeFromQueue);

module.exports = router;
