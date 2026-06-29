const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Connect to the database before starting the server
connectDB();

const app = require('./server');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[server] Server is running on port ${PORT}`);
});