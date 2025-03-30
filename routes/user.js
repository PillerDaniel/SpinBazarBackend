const User = require("../models/User");
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/account", authMiddleware, async (req, res) => {
  try {
    userId = req.user.id;

    const user = await User.findById(userId)
      .select("-password -__v")
      .populate("wallet", "-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: "User is suspended." });
    }

    return res.status(200).json({ userData: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
