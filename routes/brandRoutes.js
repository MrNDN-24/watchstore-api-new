const express = require("express");

const { getAllBrands } = require("../controllers/brandController");

const router = express.Router();

router.get("/", getAllBrands);

module.exports = router;
