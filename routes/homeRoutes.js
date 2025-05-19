const express = require("express");
const {
  getAllProducts,
  getProductImages,
} = require("../controllers/productController");
const { getAllBrands } = require("../controllers/homeController");

const router = express.Router();

router.get("/", getAllProducts);

router.get("/brands", getAllBrands);
router.get("/:id", getProductImages);
module.exports = router;
