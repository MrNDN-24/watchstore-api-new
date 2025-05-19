const express = require("express");
const {
  addReview,
  getReviewById,
  getReviewsProduct,
} = require("../controllers/reviewController");
const { verifyUser } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", verifyUser, addReview);
// router.get("/:id", getReviewById);
router.get("/:id", getReviewsProduct);

module.exports = router;
