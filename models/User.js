const mongoose = require("mongoose");

// User model
const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  role: {
    type: String,
    default: "user",
  },
  birthDate: {
    type: Date,
    required: true,
  },
  xp: {
    type: Number,
    default: 1000,
  },
  vipStatus: {
    type: String,
    default: "none",
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.virtual("wallet", {
  ref: "Wallet",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

const User = mongoose.model("User", UserSchema);

module.exports = User;
