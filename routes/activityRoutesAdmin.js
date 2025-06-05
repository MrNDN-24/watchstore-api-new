const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");

// Lấy toàn bộ activity hoặc filter theo query param userId
router.get("/", activityController.getActivities);

// Lấy chi tiết activity theo id
router.get("/:id", activityController.getActivityById);

// Xóa activity
router.delete("/:id", activityController.softDeleteActivity);

module.exports = router;
