const express = require('express');
const router = express.Router();
const products = require('../config/products.js');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', (req, res) => {
  res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', (req, res) => {
  const product = products.find((p) => p._id === req.params.id);
  res.json(product);
});

module.exports = router;