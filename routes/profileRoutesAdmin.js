const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  uploadImageToCloudinary,
} = require("../controllers/profileControllerAdmin");
const {
  authMiddleware,
  verifyUser,
  formatUserData,
} = require("../middleware/authMiddleware");

const uploadCloud = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/profile", verifyUser, getUserProfile);
router.put("/profile", formatUserData, updateUserProfile);

router.post(
  "/uploadfile",
  uploadCloud.fields([
    { name: "avatars", maxCount: 10 }, // Trường "avatars" cho phép tối đa 5 file
    { name: "documents", maxCount: 10 }, // Trường "documents" cho phép tối đa 3 file
  ]),
  uploadImageToCloudinary
);

module.exports = router;
