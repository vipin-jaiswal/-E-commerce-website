const dns = require("dns");

// Force Node.js DNS resolver to use public DNS servers
dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log("[mongodb] Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;