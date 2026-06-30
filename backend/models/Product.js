const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    description: String,
    category: String,
    price: Number,
    salePrice: Number,
    stock: Number,
    rating: Number,
    numReviews: Number,
    sold: Number,
    images: [String],
    featured: Boolean,
    bestSeller: Boolean,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
