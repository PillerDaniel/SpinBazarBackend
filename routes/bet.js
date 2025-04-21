const express = require("express");
const Wallet = require("../models/Wallet");
const cookieParser = require("cookie-parser");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(cookieParser());

//bet/placebet

router.post("/placebet", authMiddleware, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const user = req.user;

    wallet = await Wallet.findOne({ user: user.id });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found, contact support.",
        messageHU:
          "Ehhez a felhasználóhoz nem tartozik pénztárca, vegye fel a kapcsolatot az ügyfélszolgálatunkkal.",
      });
    }

    if (wallet.balance < betAmount) {
      return res.status(400).json({
        message: "Insufficient balance.",
        messageHU: "Túl alacsony az egyenlege.",
      });
    }

    wallet.balance -= betAmount;
    await wallet.save();

    if (betAmount <= 50) {
      user.xp += 20;
    } else if (betAmount > 50 && betAmount <= 250) {
      user.xp += 50;
    } else if (betAmount > 250 && betAmount <= 500) {
      user.xp += 100;
    }

    await user.save();

    return res.json({
      message: "Bet placed successfully.",
      messageHU: "Tét sikeresen megtéve.",
      wallet: wallet,
      userXp: user.xp,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

//bet/winbet

router.post("/winbet", authMiddleware, async (req, res) => {
  try {
    const { winAmount } = req.body;
    const userId = req.user.id;
    wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found, contact support.",
        messageHU:
          "Ehhez a felhasználóhoz nem tartozik pénztárca, vegye fel a kapcsolatot az ügyfélszolgálatunkkal.",
      });
    }
    wallet.balance += winAmount;
    await wallet.save();
    return res.json({
      message: "Congratulations! You won!",
      messageHU: "Gratulálunk, ön nyert.",
      wallet: wallet,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

module.exports = router;
