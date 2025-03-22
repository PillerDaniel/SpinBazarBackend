const mongoose = require("mongoose");

// History model
const HistoryShema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    default: null,
  },
  game: {
    type: String,
    required: true,
  },
  betAmount: {
    type: Number,
    required: true,
  },
  winAmount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("History", HistoryShema);
