const User = require("../models/User");
const Payment = require("../models/Payment");
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
    const user = await User.findById(req.user.id)
      .select("-password -__v")
      .populate("wallet", "-__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        messageHU: "Felhasználó nem található.",
      });
    }

    const transactions = await Payment.find({ user: user.id })
      .select("-__v -user -cardType -last4Digits")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({ userData: user, transactions: transactions });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
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
    try {
      const { oldPassword, newPassword, newPasswordConfirmation } = req.body;
      const user = req.user;
      if (!user) {
        return res.status(404).json({
          message: "User not found.",
          messageHU: "Felhasználó nem található.",
        });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) {
        return res.status(401).json({
          message: "Old password doesn't match.",
          messageHU: "A régi jelszó nem egyezik.",
        });
      }
      if (newPassword !== newPasswordConfirmation) {
        return res.status(400).json({
          message: "New passwords do not match.",
          messageHU: "Az új jelszavak nem egyeznek.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedNewPassword;
      await user.save();
      return res.status(200).json({
        message: "Password changed successfully.",
        messageHU: "Sikeresen megváltoztatta jelszavát.",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error.",
        messageHU: "Szerver hiba.",
      });
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

    try {
      const { newEmail, password } = req.body;
      const user = req.user;
      if (!user) {
        return res.status(404).json({
          message: "User not found.",
          messageHU: "Felhasználó nem található.",
        });
      }

      if (!password) {
        return res.status(400).json({
          message: "Password is required.",
          messageHU: "A jelszó megadása kötelező.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          message: "Password doesn't match.",
          messageHU: "A jelszó nem egyezik.",
        });
      }

      user.email = newEmail;
      await user.save();
      return res.status(200).json({
        message: "Email changed successfully.",
        messageHU: "Sikeresen megváltoztatta az email címét.",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Internal server error.",
        messageHU: "Szerver hiba.",
      });
    }
  }
);

// user/deactivate
router.put("/deactivate", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { password } = req.body;

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        messageHU: "Felhasználó nem található.",
      });
    }
    if (!password) {
      return res.status(400).json({
        message: "Password is required.",
        messageHU: "A jelszó megadása kötelező.",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Password doesn't match.",
        messageHU: "A jelszó nem egyezik.",
      });
    }

    user.isActive = false;

    await user.save();
    return res.status(200).json({
      message: "Account deactivated successfully.",
      messageHU: "Sikeresen felfüggesztette fiókját.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba" });
  }
});

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
