const express = require("express");
const {
  getUserAddress,
  updateUserAddress,
} = require("../controllers/addressController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyUser, getUserAddress);
router.put("/", verifyUser, updateUserAddress);

module.exports = router;
