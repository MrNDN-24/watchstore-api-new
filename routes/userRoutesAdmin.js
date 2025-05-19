const express = require('express');
const router = express.Router();
const uploadCloud = require("../middleware/uploadMiddleware");
const { createUser, updateUser, deleteUser, getAllUsers,getUserById, updateUserById, updatePassword} = require('../controllers/userControllerAdmin');
const { authMiddleware } = require('../middleware/authMiddleware');  // Import middleware

// Các route này yêu cầu xác thực
router.get('/', authMiddleware, getAllUsers);  
router.post('/', authMiddleware, createUser);
router.put('/:userId', authMiddleware, updateUser);
router.delete('/:userId', authMiddleware, deleteUser);
router.get('/:userId',authMiddleware, getUserById);
router.put("/updateById/:userId",authMiddleware, uploadCloud.single("avatar"), updateUserById);
router.put('/updatePassword/:userId', authMiddleware, updatePassword);
module.exports = router;