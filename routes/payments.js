const express = require("express");
const Wallet = require("../models/Wallet");
const Payment = require("../models/Payment");
const authMiddleware = require("../middleware/authMiddleware");
const cardValidator = require("card-validator");

const router = express.Router();

//deposit
//payments/deposit
router.post("/deposit", authMiddleware, async (req, res) => {
  try {
    const { amount, cardnumber, cvv, expireDate } = req.body;
    const user = req.user;

    if (!amount || !cardnumber || !cvv || !expireDate) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const numberValidation = cardValidator.number(cardnumber);
    const cvvValidation = cardValidator.cvv(cvv);
    const expiryValidation = cardValidator.expirationDate(expireDate);

    if (!numberValidation.isValid) {
      return res.status(400).json({ message: "Invalid card number." });
    }

    if (!cvvValidation.isValid) {
      return res.status(400).json({ message: "Invalid CVV." });
    }

    if (!expiryValidation.isValid) {
      return res.status(400).json({ message: "Invalid expiration date." });
    }

    let wallet = await Wallet.findOne({ user: user.id });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found, contact support." });
    }

    wallet.balance += amount;
    await wallet.save();

    const payment = new Payment({
      user: user.id,
      amount,
      transactionType: "deposit",
      status: "completed",
      cardType: numberValidation.card ? numberValidation.card.type : "unknown",
      last4Digits: cardnumber.slice(-4),
    });

    await payment.save();

    return res.json({ message: "Deposit successful.", wallet });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

//withdraw
//payments/withdraw
router.post("/withdraw", authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!amount) {
      return res.status(400).json({ message: "Fields are required." });
    }

    let wallet = await Wallet.findOne({ user: user.id });

    if (!wallet) {
      return res
        .status(404)
        .json({ message: "Wallet not found, contact support." });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance." });
    }

    wallet.balance -= amount;
    await wallet.save();

    const payment = new Payment({
      user: user.id,
      amount,
      transactionType: "withdraw",
      status: "completed",
      cardType: "N/A",
      last4Digits: "N/A",
    });

    await payment.save();

    return res.json({ message: "Withdrawal successful.", wallet });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
