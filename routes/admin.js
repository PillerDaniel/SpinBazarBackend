const History = require("../models/History");
const adminMiddleware = require("../middleware/adminMiddleware");
const express = require("express");

const router = express.Router();

router.get("/test", adminMiddleware, async (req, res) => {
  return res.json({ message: "Hali" });
});

module.exports = router;
