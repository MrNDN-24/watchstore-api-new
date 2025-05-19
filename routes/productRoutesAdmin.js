const express = require('express');
const router = express.Router();
const productController = require('../controllers/productControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware');

// Các route này yêu cầu xác thực
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProductActive);
router.delete('/:id', authMiddleware, productController.deleteProduct);
router.put('/update/:id', productController.updateProduct);

// Các route này không yêu cầu xác thực vì chỉ đọc dữ liệu
router.get('/:id', productController.getProductById);
router.get('/', productController.getAllProducts);
module.exports = router;
