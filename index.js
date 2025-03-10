const express = require("express");
const cors = require("cors");
const app = express();
const connectDB = require("./config/db");
const authRouter = require("./routes/auth");

connectDB();

// CORS
const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'], 
};

app.use(cors(corsOptions));

// JSON feldolgozás
app.use(express.json());

// Routes
app.use("/auth", authRouter);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Api running");
});

// Szerver indítása
app.listen(5001, () => {
  console.log("Server is running on port 5001");
});
