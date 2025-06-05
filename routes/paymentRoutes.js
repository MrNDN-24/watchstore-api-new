const express = require("express");
const { createPayment } = require("../controllers/paymentController");
const {
  momoPayment,
  callBackPayment,
} = require("../controllers/momoController");
const {
  createQRCode,
  checkPayment,
  vnpayReturn,
  vnpayRefund,
} = require("../controllers/vnPayController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", createPayment);
router.post("/momo", momoPayment);
router.post("/vnpay/create-qr", createQRCode);
router.get("/vnpay/check-payment-vnpay", checkPayment);
router.get("/vnpay/vnpay-return", vnpayReturn);
router.post("/vnpay/refund", vnpayRefund);
router.post("/callback", callBackPayment);

module.exports = router;
