const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const config = require("config");
const jwtSecret = config.get("jwtSecret");
const { body, validationResult } = require("express-validator");
//ranom address generator
const generateRandomAddress = require("../config/randomAddresGenerator");
// Register
// /auth/register

router.post(
  "/register",
  [
    //validation
    body("userName").notEmpty().withMessage("Username is required."),
    body("email").isEmail().withMessage("Invalid email."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters.")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter.")
      .matches(/\d/)
      .withMessage("Password must contain at least one number."),
    body("birthDate").notEmpty().withMessage("Birthdate is required."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userName, password, passwordConfirmation, email, birthDate } =
      req.body;

    try {
      // email or username already in use
      const existingUser = await User.findOne({
        $or: [{ email }, { userName }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Username or Email already in use." });
      }

      if (password !== passwordConfirmation) {
        return res.status(400).json({ message: "Passwords do not match." });
      }

      const age = Math.abs(
        new Date(Date.now() - new Date(birthDate).getTime()).getUTCFullYear() -
          1970
      );
      //age check
      if (age < 18) {
        return res
          .status(400)
          .json({ message: "You must be at least 18 years old to register." });
      }

      // pw hash
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(password, salt);

      const user = new User({
        userName,
        password: hashedPw,
        email,
        birthDate,
      });
      await user.save();

      //wallet for the user
      const wallet = new Wallet({
        user: user._id,
        usdtAddress: generateRandomAddress(34),
        ltcAddress: generateRandomAddress(34),
        btcAddress: generateRandomAddress(34),
      });
      await wallet.save();

      // jwt token
      const jwtData = jwt.sign(
        { user: { id: user.id, userName: user.userName } },
        jwtSecret,
        {
          expiresIn: 3600,
        }
      );

      return res
        .status(201)
        .json({ message: "User Created.", token: jwtData, wallet: wallet });
    } catch (err) {
      console.log(err);
      console.log("sadada");
      return res.status(500).json({ message: "Internal server error." });
    }
  }
);

// Login
// /auth/login

router.post("/login", async (req, res) => {
  const { userName, password } = req.body;

  try {
    const user = await User.findOne({ userName });
    const wallet = await Wallet.findOne({ user: user._id });
    console.log(wallet);

    // if user doesn't exist
    if (!user) {
      return res.status(404).json({ message: "invalid credentials." });
    }

    // check pw
    const isMatch = await bcrypt.compare(password, user.password);

    //if pw doesn't match
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        message: "Your account is suspended, contact with our support.",
      });
    }

    const jwtData = jwt.sign(
      { user: { id: user.id, userName: user.userName } },
      jwtSecret,
      {
        expiresIn: 3600,
      }
    );

    return res.status(200).json({
      message: "Logged in successfully.",
      token: jwtData,
      wallet: wallet,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
