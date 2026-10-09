  require('dotenv').config();
  const express = require("express");
  const cors = require("cors");
  const shopifyRoutes = require('./routes/shopifyRoutes');
  const authRoutes = require('./routes/authRoutes');
  const reviewRoutes = require('./routes/reviewRoutes');
  const contactRoutes = require('./routes/contactRoutes');
  const orderRoutes = require('./routes/orderRoutes');

  const app = express();

  const configuredOrigins = String(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
    .split(',').map((value) => value.trim()).filter(Boolean);
  const allowedOrigins = new Set(configuredOrigins);
  app.use(cors({
    origin: (origin, callback) => {
      // Allow same-machine local Vite development and explicitly configured storefront origins.
      if (!origin || /^https?:\/\/localhost(?::\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin) || allowedOrigins.has(origin)) {
        return callback(null, origin || true);
      }
      return callback(new Error('Origin is not allowed by CORS'));
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
  app.use('/api/contact', contactRoutes);
  app.use('/api/orders', orderRoutes);

  // Direct alias for forgot-password recovery
  app.post('/api/forgot-password', (req, res, next) => {
    req.url = '/forgot-password';
    return authRoutes(req, res, next);
  });

  module.exports = app;
