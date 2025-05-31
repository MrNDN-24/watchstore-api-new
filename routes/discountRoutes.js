const express = require("express");
const {
  validateDiscountForUser,
  getDiscounts,
  getSuitableDiscount,
} = require("../controllers/discountController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/:code", verifyUser, validateDiscountForUser);
router.get("/", verifyUser, getDiscounts);
router.get("/product-ad/suitable-discount", verifyUser, getSuitableDiscount);
// router.get("/ongoing", getOngoingDiscounts);
// router.get("/upcoming", getUpcomingDiscounts);

module.exports = router;
