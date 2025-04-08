const jwt = require("jsonwebtoken");
const config = require("config");
const jwtSecret = config.get("jwtSecret");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers["authorization"];

  //if no token provided
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token." });
    }

    try {
      const user = await User.findById(decodedToken.user.id).select(" -__v");

      console.log(user);

      req.user = user;

      // if an admin suspend a user when the user is playing
      // the user will not be able to play anymore
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account has been suspended, contact support.",
        });
      }

      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
};

module.exports = authMiddleware;
