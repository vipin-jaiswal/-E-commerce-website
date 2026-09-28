const express = require("express");
const cors = require("cors");
const shopifyRoutes = require('./routes/shopifyRoutes');
const authRoutes = require('./routes/authRoutes');
const { router: adminRoutes } = require('./routes/adminRoutes');

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // The storefront may be served by Vite (5173) or another local dev port.
    if (!origin || /^https?:\/\/localhost(?::\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)) {
      return callback(null, origin || true);
    }
    return callback(null, origin);
  },
  credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use('/api/shopify', shopifyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

module.exports = app;
