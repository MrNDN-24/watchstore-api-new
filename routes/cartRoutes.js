const express = require("express");
const {
  getCartById,
  updateCart,
  removeProductFromCart,
  validateQuantity,
} = require("../controllers/cartController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyUser, getCartById);
router.put("/", verifyUser, updateCart);
router.delete("/", verifyUser, removeProductFromCart);
router.post("/validatequantity", validateQuantity);

module.exports = router;
