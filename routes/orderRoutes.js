const express = require("express");
const {
  createOrder,
  getUserOrder,
  cancelOrder,
} = require("../controllers/orderController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", createOrder);
// router.get("/", verifyUser, getAllUserOrder);
router.get("/", verifyUser, getUserOrder);
router.delete("/:id", cancelOrder);

module.exports = router;
