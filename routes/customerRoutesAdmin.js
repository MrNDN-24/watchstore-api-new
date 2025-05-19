const express = require('express');
const router = express.Router();
const { deleteCustomer,updateCustomerStatus, getAllCustomers,getCustomerById } = require('../controllers/customerControllerAdmin'); 
const { authMiddleware } = require('../middleware/authMiddleware');  

router.put('/:customerId/status', authMiddleware, updateCustomerStatus); 
router.get('/', authMiddleware, getAllCustomers); 
router.delete("/:customerId",authMiddleware, deleteCustomer);
router.get('/:customerId', getCustomerById);  // Route lấy thông tin khách hàng theo ID
module.exports = router;
