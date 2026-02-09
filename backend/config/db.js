const mongoose = require("mongoose");

const mongodburl ="mongodb+srv://Velpaarai_Enterprices:fOJxYQfIbKvSyKh8@inventory.pftntme.mongodb.net/?appName=inventory";

const connectDB = async () => {
  try {fOJxYQfIbKvSyKh8
    await mongoose.connect(mongodburl);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
