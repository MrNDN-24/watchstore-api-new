const express = require("express");
const router = express.Router();
const {
  getCommentsByBlogId,
  createComment,
} = require("../controllers/commentController");

router.get("/:blogId", getCommentsByBlogId);
router.post("/", createComment);

module.exports = router;
