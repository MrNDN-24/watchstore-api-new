const express = require('express');  // Đúng cách require express
const router = express.Router();
const { addCategory, updateCategory, deleteCategory, getCategories, getCategoryById, updateStatus } = require('../controllers/categoryControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware'); // Import middleware

// Các route này yêu cầu xác thực
router.post('/', authMiddleware, addCategory);
router.put('/:categoryId', authMiddleware, updateCategory);
router.delete('/:categoryId', authMiddleware, deleteCategory);
router.put('/status/:categoryId', authMiddleware, updateStatus);

// Các route này không yêu cầu xác thực vì chỉ đọc dữ liệu
router.get('/', getCategories);
router.get('/:categoryId', getCategoryById);

module.exports = router;
