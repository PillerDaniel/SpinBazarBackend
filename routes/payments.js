const express = require("express");
const Wallet = require("../models/Wallet");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

module.exports = router;
