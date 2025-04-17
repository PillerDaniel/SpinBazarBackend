const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
    set: (value) => parseFloat(value.toFixed(2)),
  },
  transactionType: {
    type: String,
    required: true,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
  },
  cardType: {
    type: String,
    required: true,
  },
  last4Digits: {
    type: String,
    required: true,
  },
});

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
