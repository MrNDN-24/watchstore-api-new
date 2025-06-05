const express = require("express");
const { getBlogs, getBlogById } = require("../controllers/blogController");

const { optionalAuth} = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/",optionalAuth, getBlogs);
router.get("/:id",optionalAuth ,getBlogById);

module.exports = router;
