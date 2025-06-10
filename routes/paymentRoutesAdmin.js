const express = require('express');
const router = express.Router();
const {
  getPayments,
  getPaymentDetail,
} = require("../controllers/paymentControllerAdmin");

router.get("/", getPayments);
router.get("/:id", getPaymentDetail);



module.exports = router;
