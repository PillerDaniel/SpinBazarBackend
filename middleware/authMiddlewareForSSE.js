const jwt = require("jsonwebtoken");
const config = require("config");
const jwtSecret = config.get("jwtSecret");

const authMiddlewareForSSE = (req, res, next) => {
  const token = req.query.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, jwtSecret, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token." });
    }
    req.user = decodedToken.user;
    next();
  });
};

module.exports = authMiddlewareForSSE;
