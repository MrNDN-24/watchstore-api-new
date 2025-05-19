const express = require('express');
const router = express.Router();
const { getAllPayments } = require('../controllers/paymentControllerAdmin');

router.get('/', getAllPayments);

module.exports = router;
