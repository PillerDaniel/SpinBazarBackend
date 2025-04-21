const History = require("../models/History");
const authMiddleware = require("../middleware/authMiddleware");
const express = require("express");

const router = express.Router();

// history/addhistory
router.post("/addhistory", authMiddleware, async (req, res) => {
  try {
    const { game, betAmount, winAmount } = req.body;
    const userId = req.user.id;

    const history = new History({
      user: userId,
      game,
      betAmount,
      winAmount,
    });

    await history.save();

    return res.json({
      message: "History added.",
      messageHU: "Elözmény hozzáadva.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Interal server error.", messageHU: "Szerver hiba." });
  }
});

// history/gethistory
router.get("/gethistory", authMiddleware, async (req, res) => {
  try {
    const { game } = req.body;
    const userId = req.user.id;

    if (!game) {
      const history = await History.find({ user: userId });
      return res.status(200).json({ history: history });
    }

    const history = await History.find({ user: userId, game: game });
    return res.status(200).json({ history: history });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error.", messageHU: "Szerver hiba." });
  }
});

module.exports = router;
