const express = require("express");
const cors = require("cors");
const app = express();
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");
const betRouter = require("./routes/bet");
const historyRouter = require("./routes/history");
const adminRouter = require("./routes/admin");
const cookieParser = require("cookie-parser");

connectDB();

// CORS
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRouter);
app.use("/bet", betRouter);
app.use("/history", historyRouter);
app.use("/admin", adminRouter);

app.get("/", (req, res) => {
  res.send("Api running");
});

app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
