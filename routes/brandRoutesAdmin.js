const express = require('express'); 
const router = express.Router();
const uploadCloud = require("../middleware/uploadMiddleware");
const { addBrand, getBrand, getAllBrands, updateBrand, deleteBrand, updateBrandActive } = require("../controllers/brandControllerAdmin");
const { authMiddleware } = require('../middleware/authMiddleware');  // Import middleware

// Các route này yêu cầu xác thực
router.post("/add", authMiddleware, uploadCloud.single("image"), addBrand);
router.put("/:id", authMiddleware, uploadCloud.single("image"), updateBrand);
router.put("/updateActive/:id", authMiddleware, updateBrandActive);  
router.delete("/:id", authMiddleware, deleteBrand);

// Các route này không yêu cầu xác thực vì chỉ đọc dữ liệu
router.get("/:id", getBrand);
router.get("/", getAllBrands);

module.exports = router;
