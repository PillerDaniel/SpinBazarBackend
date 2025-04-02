const mongoose = require("mongoose");
const config = require("config");
const db = config.get("mongoURI");

const connectDB = async () => {
  let retries = 0;
  const maxRetries = 10;

  const connectWithRetry = async () => {
    try {
      await mongoose.connect(db, {});
      console.log("DB Connected");
    } catch (err) {
      retries++;
      console.error(
        `MongoDB connection failed (${retries}/${maxRetries})`,
        err.message
      );

      if (retries < maxRetries) {
        console.log("Retrying connection in 5 seconds.");
        setTimeout(connectWithRetry, 60000);
      } else {
        console.error("Max retries reached. Exiting process.");
        process.exit(1);
      }
    }
  };

  connectWithRetry();
};

module.exports = connectDB;
