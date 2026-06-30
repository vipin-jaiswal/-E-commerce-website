const mongoose = require("mongoose");
const dns = require('node:dns');



// Force Node.js to use specific DNS servers for hostname resolution.

// This can help resolve `ECONNREFUSED` errors on some networks.

dns.setServers([

  "1.1.1.1", // Cloudflare

  "8.8.8.8", // Google

]);

dns.setDefaultResultOrder('ipv4first');


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Server:", conn.connection.host);
    console.log("Database Name:", conn.connection.name);

  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;