const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const products = require("./data/products");

dotenv.config();

async function seedProducts() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required to seed products");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || "DYVA",
  });
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
}

seedProducts().catch(async (error) => {
  console.error("Seed failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
