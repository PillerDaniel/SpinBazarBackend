const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("config");
const jwtSecret = config.get("jwtSecret");
const { body, validationResult } = require("express-validator");
 
// Register
// /auth/register
 
router.post(
  "/register",
  [
    //validation
    body("userName").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 character"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
 
    const { userName, password, email } = req.body;
 
    try {
      // email or username already in use
      const existingUser = await User.findOne({
        $or: [{ email }, { userName }],
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Username or Email already in use" });
      }
 
      // pw hash
      const salt = await bcrypt.genSalt(10);
      const hashedPw = await bcrypt.hash(password, salt);
 
      const user = new User({
        userName,
        password: hashedPw,
        email,
      });
 
      await user.save();
 
      // jwt token
      const jwtData = jwt.sign(
        { user: { id: user.id, userName: user.userName } },
        jwtSecret,
        {
          expiresIn: 3600,
        }
      );
 
      res.status(201).json({ message: "User Created", token: jwtData });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);
 
// Login
// /auth/login
 
router.post("/login", async (req, res) => {
  const { userName, password } = req.body;
 
  try {
    const user = await User.findOne({ userName });
 
    // if user doesn't exist
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
 
    // check pw
    const isMatch = await bcrypt.compare(password, user.password);
 
    //if pw doesn't match
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
 
    const jwtData = jwt.sign(
      { user: { id: user.id, userName: user.userName } },
      jwtSecret,
      {
        expiresIn: 3600,
      }
    );
 
    res.status(200).json({ message: "Logged in successfully", token: jwtData });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});
 
module.exports = router;