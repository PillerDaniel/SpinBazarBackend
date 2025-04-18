const mongoose = require("mongoose");

// Wallet model
const WalletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    default: null,
  },
  balance: {
    type: Number,
    default: 0,
    set: (value) => parseFloat(value.toFixed(2)),
  },
  usdtAddress: {
    type: String,
    default: "",
    unique: true,
  },
  ltcAddress: {
    type: String,
    default: "",
    unique: true,
  },
  btcAddress: {
    type: String,
    default: "",
    unique: true,
  },
  dailyBonusClaimed: {
    type: Date,
    default: () => new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
});

module.exports = mongoose.model("Wallet", WalletSchema);
