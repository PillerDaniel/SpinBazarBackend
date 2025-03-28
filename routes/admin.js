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

// suspend user
// admin/suspenduser/:id

router.put("/suspenduser/:id", adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot suspend an admin." });
    }

    if (user.suspended) {
      return res.status(400).json({ message: "User already suspended." });
    }

    user.isActive = false;

    await user.save();
    return res.status(200).json({ message: "User suspended." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

//activate user
// admin/acticateuser/:id

router.put("/activateuser/:id", adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.suspended) {
      return res.status(400).json({ message: "User already activated." });
    }
    user.isActive = true;
    await user.save();
    return res.status(200).json({ message: "User activated." });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
