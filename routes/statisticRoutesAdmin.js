const express = require('express');
const { getStatistics,getTopProducts,getAvailableYears ,getOrdersByYear} = require('../controllers/statisticControllerAdmin');

const router = express.Router();

router.get('/', getStatistics);
router.get('/topProducts', getTopProducts);
router.get('/toltalYear',getAvailableYears)
router.get('/getOrderByYear',getOrdersByYear)
module.exports = router;
