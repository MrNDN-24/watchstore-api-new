const express = require('express');
const router = express.Router();
const { 
  addStyle, 
  updateStyle, 
  deleteStyle, 
  getStyles, 
  getStyleById, 
  updateStatus 
} = require('../controllers/styleControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware'); // Import middleware

// Các route này yêu cầu xác thực
router.post('/', authMiddleware, addStyle);
router.put('/:styleId', authMiddleware, updateStyle);
router.delete('/:styleId', authMiddleware, deleteStyle);
router.put('/status/:styleId', authMiddleware, updateStatus);

// Các route này không yêu cầu xác thực vì chỉ đọc dữ liệu
router.get('/', getStyles);
router.get('/:styleId', getStyleById);

module.exports = router;
