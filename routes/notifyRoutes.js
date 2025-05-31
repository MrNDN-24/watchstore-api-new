const express = require("express");
const router = express.Router();
const {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notifyController");

// Nếu có middleware xác thực thì gắn vào
// const { protect } = require("../middleware/authMiddleware");

router.get("/:userId", getNotifications);
router.post("/", createNotification);
router.put("/:id/read", markAsRead);
router.put("/:userId/mark-all-read", markAllAsRead);

module.exports = router;
