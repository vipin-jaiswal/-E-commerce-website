require('dotenv').config();
const express = require("express");
const cors = require("cors");
const shopifyRoutes = require('./routes/shopifyRoutes');
const authRoutes = require('./routes/authRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

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
app.use('/api/reviews', reviewRoutes);

// Direct aliases for auth recovery
app.post('/api/forgot-password', (req, res, next) => {
  req.url = '/forgot-password';
  return authRoutes(req, res, next);
});
app.post('/api/reset-password', (req, res, next) => {
  req.url = '/reset-password';
  return authRoutes(req, res, next);
});

module.exports = app;
