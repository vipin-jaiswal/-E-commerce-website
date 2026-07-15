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
    weights: {
      type: [String],
      enum: ["50 gm", "100 gm", "150 gm"],
      default: ["50 gm", "100 gm", "150 gm"],
    },
    rating: Number,
    numReviews: Number,
    sold: Number,
    images: [String],
    featured: Boolean,
    bestSeller: Boolean,
    comingSoon: { type: Boolean, default: false },
    // Empty means the product can be delivered throughout India.
    availableRegions: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", productSchema);
