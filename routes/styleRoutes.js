const express = require("express");
const getAllStyle = require("../controllers/styleController");

const router = express.Router();

router.get("/", getAllStyle);

module.exports = router;
