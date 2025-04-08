const User = require("../models/User");
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// user data for mainpage loading
// data/userdata
router.get("/userdata", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    await user.populate("wallet", "-__v -_id");

    const userDto = {
      username: user.userName,
      xp: user.xp,
      role: user.role,
      wallet: user.wallet,
    };
    res.status(200).json({ user: userDto });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
