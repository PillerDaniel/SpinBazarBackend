const User = require("../models/User");
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authMiddlewareForSSE = require("../middleware/authMiddlewareForSSE");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const router = express.Router();

// account
// user/account

router.get("/account", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    await user.populate("wallet", "-__v");

    console.log("useraccount:", user);

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

// change password
// user/changepassword
router.put(
  "/changepassword",
  [
    //newPassword validation, same validation as in register
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters.")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter.")
      .matches(/\d/)
      .withMessage("Password must contain at least one number."),
  ],
  authMiddleware,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { oldPassword, newPassword } = req.body;
    console.log("oldPassword", oldPassword);
    console.log("newPassword", newPassword);

    try {
      const userId = req.user;
      const user = await User.findById(userId).select("-__v");
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Old password doesn't match." });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);
      console.log("hashedNewPassword", hashedNewPassword);

      user.password = hashedNewPassword;
      await user.save();
      return res
        .status(200)
        .json({ message: "Password changed successfully." });
    } catch (error) {
      console.log("error", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  }
);

// user/changeemail
router.put(
  "/changeemail",
  [body("newEmail").isEmail().withMessage("Invalid email.")],
  authMiddleware,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newEmail } = req.body;

    try {
      const user = req.user;
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      user.email = newEmail;
      await user.save();
      return res.status(200).json({ message: "Email changed successfully." });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error." });
    }
  }
);

//sse
router.get("/event", authMiddlewareForSSE, async (req, res) => {
  const userId = req.user.id;

  res.header("Content-Type", "text/event-stream");
  res.header("Cache-Control", "no-cache");
  res.header("Connection", "keep-alive");

  setInterval(async () => {
    try {
      const user = await User.findById(userId)
        .select("-password -__v")
        .populate("wallet", "-__v");

      const uData = {
        id: user.id,
        xp: user.xp,
        balance: user.wallet.balance,
      };

      const message = {
        userData: uData,
      };

      res.write(`data:${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, 5000);

  req.on("close", () => {
    console.log("kliens kilépett");
  });
});

module.exports = router;
