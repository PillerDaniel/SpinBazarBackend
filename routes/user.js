const User = require("../models/User");
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authMiddlewareForSSE = require("../middleware/authMiddlewareForSSE");

const router = express.Router();

router.get("/account", authMiddleware, async (req, res) => {
  try {
    userId = req.user.id;

    const user = await User.findById(userId)
      .select("-password -__v")
      .populate("wallet", "-__v");

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
