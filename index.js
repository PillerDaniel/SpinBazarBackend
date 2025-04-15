const express = require("express");
const cors = require("cors");
const app = express();
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const betRouter = require("./routes/bet");
const historyRouter = require("./routes/history");
const adminRouter = require("./routes/admin");
const userRouter = require("./routes/user");
const paymentsRouter = require("./routes/payments");
const dataRouter = require("./routes/data");
const bonusRouter = require("./routes/bonus");
const cookieParser = require("cookie-parser");

const originMiddleware = require("./middleware/originMiddleware");

connectDB();

// CORS
const corsOptions = {
  origin: "http://localhost:5174",
  methods: ["GET", "POST", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Origin Middleware
// Runs before all request
//app.use(originMiddleware);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/bet", betRouter);
app.use("/api/history", historyRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/bonus", bonusRouter);
app.use("/api/data", dataRouter);

app.get("/", (req, res) => {
  res.send("Api running");
});

app.listen(5051, "0.0.0.0", () => {
  console.log("Server is running on port 5051");
});
