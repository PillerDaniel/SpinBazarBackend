const History = require("../models/History");
const User = require("../models/User");
const adminMiddleware = require("../middleware/adminMiddleware");
const express = require("express");
const Payment = require("../models/Payment");
const router = express.Router();

//get users
// admin/getusers
router.get("/getusers", adminMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select("-password -__v");

    if (!users) {
      return res.status(400).json({
        message: "No users found.",
        messageHU: "Nem találtunk felhasználókat.",
      });
    }

    return res.status(200).json({ users: users });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

// suspend user
// admin/suspenduser/:id

router.put("/suspenduser/:id", adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        messageHU: "Felhasználó nem található.",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        message: "Cannot suspend an admin.",
        messageHU: "Nem lehet felfüggeszteni egy adminisztrátort.",
      });
    }

    if (user.suspended) {
      return res.status(400).json({
        message: "User already suspended.",
        messageHU: "A felhasználó már fel van függesztve.",
      });
    }

    user.isActive = false;

    await user.save();
    return res.status(200).json({
      message: "User suspended successfully.",
      messageHU: "Felhasználó sikeresen felfüggesztve.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

//activate user
// admin/acticateuser/:id

router.put("/activateuser/:id", adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        messageHU: "Felhasználó nem található.",
      });
    }

    if (user.suspended) {
      return res.status(400).json({
        message: "User already activated.",
        messageHU: "A felhasználó aktív.",
      });
    }
    user.isActive = true;
    await user.save();
    return res.status(200).json({
      message: "User activated.",
      messageHU: "Felhasználó aktiválva.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

//edit user
// admin/edituser/:id

router.put("/edituser/:id", adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const { userName, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        messageHU: "Felhasználó nem található.",
      });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        message: "Cannot edit an admin.",
        messageHU: "Nem lehet szerkeszteni egy adminisztrátort.",
      });
    }

    if (userName && userName !== user.userName) {
      const existingUser = await User.findOne({ userName });
      if (existingUser) {
        return res.status(400).json({
          message: "Username already taken.",
          messageHU: "Ez a felhasználónév már használatban van.",
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          message: "Email already in use.",
          messageHU: "Ez az email cím már használatban van.",
        });
      }
    }

    user.userName = userName || user.userName;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();

    return res.json({
      message: "User updated successfully.",
      messageHU: "A felhasználó sikeresen frissítve.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

router.get("/userprofile/:id", adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
      .select("-password -__v")
      .populate("wallet", "-__v");
    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        messageHU: "Felhasználó nem található.",
      });
    }

    const histories = await History.find({ user: userId }).select("-__v");
    const transactions = await Payment.find({ user: userId }).select("-__v");

    return res
      .status(200)
      .json({ user: user, histories: histories, transactions: transactions });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

module.exports = router;
