const express = require('express');  // Đúng cách require express
const router = express.Router();
const uploadCloud = require("../middleware/uploadMiddleware");
const { addImage, getImagesByProduct, deleteImage, updateImage } = require("../controllers/imageControllerAdmin");
const { authMiddleware } = require('../middleware/authMiddleware');  // Import middleware

// Các route này yêu cầu xác thực
router.post("/add", authMiddleware, uploadCloud.single("image"), addImage);  
router.delete("/:id", authMiddleware, deleteImage); 
router.put("/:id", authMiddleware, uploadCloud.single("image"), updateImage);  

// Các route này không yêu cầu xác thực vì chỉ đọc dữ liệu
router.get("/:productId", getImagesByProduct);

module.exports = router;
