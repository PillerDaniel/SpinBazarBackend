const History = require("../models/History");
const User = require("../models/User");
const adminMiddleware = require("../middleware/adminMiddleware");
const express = require("express");

const router = express.Router();

//get users
// admin/getusers

router.get("/getusers", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select("-password -__v");

    if (!users) {
      return res.status(400).json({ message: "No users found." });
    }

    return res.status(200).json({ users: users });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
