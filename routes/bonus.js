const express = require("express");
const Wallet = require("../models/Wallet");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

//claim daily bonus
// /bonus/claimdaily
router.post("/claimdaily", authMiddleware, async (req, res) => {
  try {
    const user = req.user;

    const wallet = await Wallet.findOne({ user: user.id });

    const currentDate = new Date();

    const hoursSinceLastClaim =
      (currentDate - new Date(wallet.dailyBonusClaimed)) / (1000 * 60 * 60);

    if (hoursSinceLastClaim < 24) {
      return res.status(400).json({
        message: "Daily bonus already claimed.",
        messageHU: "Már begyüjtötte a napi bónuszt, próbálkozzon később.",
      });
    }

    //daily bonus by user xp
    let baseBonus = 2;

    switch (true) {
      case user.xp > 100000:
        baseBonus += 10;
        break;
      case user.xp >= 90000:
        baseBonus += 9;
        break;
      case user.xp >= 80000:
        baseBonus += 8;
        break;
      case user.xp >= 70000:
        baseBonus += 7;
        break;
      case user.xp >= 60000:
        baseBonus += 6;
        break;
      case user.xp >= 50000:
        baseBonus += 5;
        break;
      case user.xp >= 40000:
        baseBonus += 4;
        break;
      case user.xp >= 30000:
        baseBonus += 3;
        break;
      case user.xp >= 20000:
        baseBonus += 2;
        break;
      case user.xp >= 10000:
        baseBonus += 1;
        break;
      case user.xp <= 1000:
        baseBonus += 0;
        break;
    }

    wallet.balance += baseBonus;
    wallet.dailyBonusClaimed = currentDate;

    await wallet.save();

    return res.status(200).json({
      message: "Daily bonus claimed successfully.",
      messageHU: "Napi bónusz sikeresen begyüjtve.",
      balance: wallet.balance,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

module.exports = router;
