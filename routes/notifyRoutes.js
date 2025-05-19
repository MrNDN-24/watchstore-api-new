const express = require("express");
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
} = require("../controllers/notifyController");

// Nếu có middleware xác thực thì gắn vào
// const { protect } = require("../middleware/authMiddleware");

router.get("/:userId", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markAsRead);

module.exports = router;
