const express = require("express");
const {
  getUserProfile,
  getAllUser,
  updateUserProfile,
  uploadImageToCloudinary,
} = require("../controllers/userController");
const {
  authMiddleware,
  verifyUser,
  formatUserData,
} = require("../middleware/authMiddleware");

const uploadCloud = require("../config/cloudinary");

const router = express.Router();

router.get("/profile", verifyUser, getUserProfile);
// router.get("/alluser", getAllUser);
router.put("/profile", formatUserData, updateUserProfile);

router.post(
  "/uploadfile",
  uploadCloud.single("image"), // Chỉ cho phép upload một file với trường "image"
  uploadImageToCloudinary
);

module.exports = router;
