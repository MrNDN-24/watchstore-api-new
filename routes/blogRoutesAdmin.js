const express = require('express');
const router = express.Router();
const uploadCloud = require("../middleware/uploadMiddleware");
const blogController = require('../controllers/blogControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware');

// 1. Tạo mới bài viết
router.post('/create', authMiddleware, uploadCloud.single("image"), blogController.createBlog);

// 2. Lấy danh sách bài viết (có phân trang, tìm kiếm)
router.get('/', blogController.getBlogs);

// 3. Cập nhật bài viết theo id
router.put('/:id', authMiddleware, uploadCloud.single("image"), blogController.updateBlog);

// 4. Xóa bài viết (soft delete)
router.delete('/:id', authMiddleware, blogController.deleteBlog);

module.exports = router;
