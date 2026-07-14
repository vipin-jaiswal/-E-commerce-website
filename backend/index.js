const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedAdminUser = require('./utils/seedAdminUser');
const seedBanners = require('./utils/seedBanners');

// Load environment variables from .env file
dotenv.config();

const app = require('./server');
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await seedAdminUser();
  await seedBanners();

  app.listen(PORT, () => {
    console.log(`[server] Server is running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
