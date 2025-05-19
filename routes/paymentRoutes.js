const express = require("express");
const { createPayment } = require("../controllers/paymentController");
const {
  momoPayment,
  callBackPayment,
} = require("../controllers/momoController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", createPayment);
router.post("/momo", momoPayment);
router.post("/callback", callBackPayment);

module.exports = router;
