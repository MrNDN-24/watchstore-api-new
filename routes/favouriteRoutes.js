const express = require("express");
const {
  getFavouritesByUserId,
  addToFavourite,
  removeFromFavourite,
} = require("../controllers/favouriteController");
const { verifyUser } = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyUser, getFavouritesByUserId);
router.post("/:id", verifyUser, addToFavourite);
router.delete("/:id", verifyUser, removeFromFavourite);

module.exports = router;
