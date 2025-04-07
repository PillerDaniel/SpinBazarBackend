const express = require("express");
const Wallet = require("../models/Wallet");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

//claim daily bonus
// /bonus/claimdaily
router.post("/claimdaily", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await Wallet.findOne({ user: userId });

    const currentDate = new Date();

    const hoursSinceLastClaim =
      (currentDate - new Date(wallet.dailyBonusClaimed)) / (1000 * 60 * 60);

    if (hoursSinceLastClaim < 24) {
      return res.status(400).json({ message: "Daily bonus already claimed." });
    }

    wallet.balance += 2;
    wallet.dailyBonusClaimed = currentDate;

    await wallet.save();

    return res.status(200).json({
      message: "Daily bonus claimed successfully.",
      balance: wallet.balance,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
