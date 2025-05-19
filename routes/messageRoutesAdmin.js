const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageControllerAdmin");
const { authMiddleware } = require('../middleware/authMiddleware');// middleware xác thực JWT

// router.post("/messages", authMiddleware, messageController.sendMessage);
// router.get("/messages/:userId2", authMiddleware, messageController.getMessagesBetweenUsers);
// router.patch("/messages/:messageId/read", authMiddleware, messageController.markAsRead);
// router.delete("/messages/:messageId", authMiddleware, messageController.deleteMessage);
router.post("/", messageController.sendMessage);
router.get("/", messageController.getMessagesBetweenUsers); // sửa lại ở đây
router.patch("/:messageId/read", messageController.markAsRead);
router.delete("/:messageId", messageController.deleteMessage);
module.exports = router;
