const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongodbUrl = process.env.MONGODB_URI;
    if (!mongodbUrl) {
      throw new Error("MONGODB_URI is not set in the environment");
    }
    await mongoose.connect(mongodbUrl);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;