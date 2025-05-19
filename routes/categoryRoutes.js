const express = require("express");
const getAllCategory = require("../controllers/categoryController");

const router = express.Router();

router.get("/", getAllCategory);

module.exports = router;
