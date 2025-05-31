const express = require("express");
const {
  getProductById,
  getProductImages,
  getProducts,
  createProduct,
  getProductChatBot,
    getTopSellingProduct
} = require("../controllers/productController");

const router = express.Router();

// router.get("/:id", getProductById);
// router.get("/chatbot", getProductChatBot);
// router.get("/images/:id", getProductImages);
// router.get("/", getProducts);
// router.post("/", createProduct);

router.get("/", getProducts);                  // Lấy danh sách sản phẩm
router.get("/chatbot", getProductChatBot);    // API riêng cho chatbot
router.get("/:id", getProductById);            // Lấy sản phẩm theo id
router.get("/images/:id", getProductImages);   // Lấy hình ảnh sản phẩm
router.post("/", createProduct);                // Tạo sản phẩm mới
router.get("/product-ad/top-selling", getTopSellingProduct); // Lấy sản phẩm bán chạy nhất
// router.get("/:id", getProductImages);

module.exports = router;
