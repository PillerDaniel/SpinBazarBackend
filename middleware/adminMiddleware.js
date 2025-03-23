const jwt = require("jsonwebtoken");
const config = require("config");
const jwtSecret = config.get("jwtSecret");

const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token." });
    }

    if (decodedToken.user.role !== "admin") {
      console.log(decodedToken.user);
      return res.status(401).json({ message: "Acces denied." });
    }

    req.user = decodedToken.user;
    next();
  });
};

module.exports = adminMiddleware;
