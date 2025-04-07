const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const config = require("config");
const { body, validationResult } = require("express-validator");
const cookieParser = require("cookie-parser");
const generateUniqueWallet = require("../config/generateUniqueWallet");

const jwtSecret = config.get("jwtSecret");
const refreshSecret = config.get("refreshSecret");

const activeRefreshTokens = new Set();

const router = express.Router();
router.use(cookieParser());

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
      wallet = await generateUniqueWallet(user._id);

      // jwt token 30min
      const jwtData = jwt.sign(
        {
          user: {
            id: user.id,
            userName: user.userName,
            role: user.role,
            wallet: wallet,
          },
        },
        jwtSecret,
        {
          expiresIn: 1800,
        }
      );
      //refresh token 3h
      const refreshToken = jwt.sign(
        { user: { id: user.id, userName: user.userName, role: user.role } },
        refreshSecret,
        {
          expiresIn: 10800,
        }
      );

      //save refresh token
      activeRefreshTokens.add(refreshToken);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 3 * 60 * 60 * 1000,
      });
      return res.status(201).json({
        message: "Succesful registration.",
        token: jwtData,
      });
    } catch (err) {
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

    if (!user) {
      return res.status(404).json({ message: "invalid credentials." });
    }

    const wallet = await Wallet.findOne({ user: user._id });

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

    user.lastLogin = Date.now();
    await user.save();

    // acces token
    const jwtData = jwt.sign(
      {
        user: {
          id: user.id,
          userName: user.userName,
          role: user.role,
          wallet: wallet,
        },
      },
      jwtSecret,
      {
        expiresIn: 3600,
      }
    );

    //refresh token
    const refreshToken = jwt.sign(
      { user: { id: user.id, userName: user.userName, role: user.role } },
      refreshSecret,
      {
        expiresIn: 10800,
      }
    );

    activeRefreshTokens.add(refreshToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 3 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Logged in successfully.",
      token: jwtData,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error." });
  }
});

// Refresh route
// /auth/refresh
router.post("/refresh", async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({ message: "No refresh token provided." });
  }

  if (!activeRefreshTokens.has(oldRefreshToken)) {
    return res
      .status(403)
      .json({ message: "Token has been already used or expired." });
  }

  jwt.verify(oldRefreshToken, refreshSecret, (err, decodedToken) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token." });
    }

    res.clearCookie("refreshToken");
    activeRefreshTokens.delete(oldRefreshToken);

    const wallet = Wallet.findOne({ user: decodedToken.user.id });

    const newAccesToken = jwt.sign(
      {
        user: {
          id: decodedToken.user.id,
          userName: decodedToken.user.userName,
          wallet: wallet,
          role: decodedToken.user.role,
        },
      },
      jwtSecret,
      {
        expiresIn: 1800,
      }
    );

    const refreshToken = jwt.sign(
      {
        user: {
          id: decodedToken.user.id,
          userName: decodedToken.user.userName,
          role: decodedToken.user.role,
        },
      },
      refreshSecret,
      {
        expiresIn: 10800,
      }
    );

    activeRefreshTokens.add(refreshToken);
    //update refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 3 * 60 * 60 * 1000,
    });

    res.status(200).json({ token: newAccesToken });
  });
});

// Logout
// /auth/logout

router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    activeRefreshTokens.delete(refreshToken);
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully." });
  }
});

module.exports = router;
