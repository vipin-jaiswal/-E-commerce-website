const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

const normalize = (product) => ({
  ...product,
  id: product.id || product._id?.toString(),
});

const buildFlexibleCategoryPattern = (value = "") => {
  const cleaned = String(value).trim();
  if (!cleaned) return null;

  // Create a regex pattern that is flexible with separators (space, hyphen, underscore).
  // It splits the input by any of these separators, escapes each part for regex safety,
  // and then joins them back with a regex pattern that matches one or more separators.
  // For example, "skin-care" becomes a regex that can match "Skin Care", "skin_care", etc.
  const pattern = cleaned
    .split(/[\s_-]+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s_-]+");

  return new RegExp(`^${pattern}$`, "i");
};

router.get("/", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    let limit = 12;
    if (req.query.limit != null) {
      const parsedLimit = Number(req.query.limit);
      // We allow 0 for no limit.
      if (!isNaN(parsedLimit) && parsedLimit >= 0) {
        limit = parsedLimit;
      }
    }
    const skip = limit > 0 ? (page - 1) * limit : 0;

    const filter = {};
    if (req.query.keyword || req.query.q) {
      const keyword = (req.query.keyword || req.query.q || "").trim();
      // Using a simple case-insensitive regex search.
      // The original `normalizeText` function is complex to replicate efficiently in a query.
      // For better search, consider a text index on the Product schema.
      const searchRegex = new RegExp(keyword, "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ];
    }

    if (req.query.category) {
      // Match both slugs like `skin-care` and stored labels like `Skin Care`.
      const categoryPattern = buildFlexibleCategoryPattern(req.query.category);
      if (categoryPattern) {
        filter.category = categoryPattern;
      }
    }

    if (req.query.featured === "true") {
      filter.featured = true;
    }

    if (req.query.bestSeller === "true") {
      filter.bestSeller = true;
    }

    const total = await Product.countDocuments(filter);
    const pages = limit > 0 ? Math.ceil(total / limit) : total > 0 ? 1 : 0;

    const pipeline = [];
    pipeline.push({ $match: filter });

    const sortQuery = String(req.query.sort || "newest").trim();
    if (sortQuery === "price_asc" || sortQuery === "price_desc") {
      pipeline.push({
        $addFields: {
          effectivePrice: { $ifNull: ["$salePrice", "$price"] },
        },
      });
    }

    const sort = {};
    switch (sortQuery) {
      case "price_asc":
        sort.effectivePrice = 1;
        break;
      case "price_desc":
        sort.effectivePrice = -1;
        break;
      case "rating":
        sort.rating = -1;
        break;
      case "best_seller":
        sort.sold = -1;
        break;
      case "newest":
      default:
        sort.createdAt = -1;
    }
    pipeline.push({ $sort: sort });

    pipeline.push({ $skip: skip });
    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    const products = await Product.aggregate(pipeline);

    res.json({
      data: products.map(normalize),
      total,
      page,
      pages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id }, { id: req.params.id }],
    }).lean();
    if (product) {
      return res.json(normalize(product));
    }
    return res.status(404).json({ message: "Product not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
