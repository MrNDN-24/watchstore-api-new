const express = require('express');
const { getStatistics,getTopProducts } = require('../controllers/statisticControllerAdmin');

const router = express.Router();

router.get('/', getStatistics);
router.get('/topProducts', getTopProducts);
module.exports = router;
