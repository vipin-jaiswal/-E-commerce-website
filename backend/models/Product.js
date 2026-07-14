const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    description: String,
    category: String,
    categories: [String],
    subCategory: String,
    subCategories: [String],
    price: Number,
    salePrice: Number,
    stock: Number,
    rating: Number,
    numReviews: Number,
    sold: Number,
    images: [String],
    featured: Boolean,
    bestSeller: Boolean,
    // Empty means the product can be delivered throughout India.
    availableRegions: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
