const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

mongoose.connect(db);

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewurlParser: true,
      useCreateIndex: true,
    });
    console.log("DB connected");
  } catch (err) {
    console.error(err.message);
    //kilepes hiba miatt
    process.exit(1);
  }
};

module.exports = connectDB;
