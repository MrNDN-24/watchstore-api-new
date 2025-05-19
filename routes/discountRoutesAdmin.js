const express = require('express');
const router = express.Router();
const uploadCloud = require("../middleware/uploadMiddleware");
const discountController = require('../controllers/discountControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware');

// 1. Tạo mới mã giảm giá (chương trình)
router.post('/create',  uploadCloud.single("image"), discountController.createDiscount);

// 2. Lấy danh sách mã giảm giá
router.get('/' ,discountController.getDiscounts);

// 3. Cập nhật mã giảm giá
router.put('/:code', uploadCloud.single("image") , discountController.updateDiscount);

// 4. Xóa mã giảm giá
router.delete('/:code',authMiddleware , discountController.deleteDiscount);

// 5. Kiểm tra mã giảm giá cho người dùng
router.post('/:code/validate',authMiddleware , discountController.validateDiscountForUser);

module.exports = router;
