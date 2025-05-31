const express = require('express');
const router = express.Router();
const {createConversation,assignStaff,closeConversation} = require('../controllers/conversationController');
const { authMiddleware, verifyUser,verifyAnyUser } = require('../middleware/authMiddleware');
// Khách hàng tạo conversation
router.post('/', verifyUser, createConversation);

// Gán nhân viên hỗ trợ conversation
router.put('/assign-staff', authMiddleware, assignStaff);

// Đóng conversation
router.put('/close',verifyAnyUser, closeConversation);

module.exports = router;
