const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('../models/Product');

dotenv.config();

async function addDefaultProductWeights() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME || 'DYVA',
  });

  const result = await Product.updateMany(
    { $or: [{ weights: { $exists: false } }, { weights: { $size: 0 } }] },
    { $set: { weights: ['50 gm', '100 gm', '150 gm'] } }
  );
  console.log(`Updated ${result.modifiedCount} products with default weights`);
  await mongoose.disconnect();
}

addDefaultProductWeights().catch(async (error) => {
  console.error('Product weight migration failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
