const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const Review = require("../models/Review");
const mongoose = require("mongoose");

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

const normalizeStringList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
  }
  return [...new Set(String(value).split(/[,\n]/).map((item) => item.trim()).filter(Boolean))];
};

const getPrimaryValue = (value, fallbackList = []) => {
  const list = normalizeStringList(value);
  if (list.length > 0) return list[0];
  return fallbackList[0] || "";
};

const buildCategoryFilter = (value = "") => {
  const categoryPattern = buildFlexibleCategoryPattern(value);
  if (!categoryPattern) return null;

  return {
    $or: [
      { category: categoryPattern },
      { categories: categoryPattern },
      { subCategory: categoryPattern },
      { subCategories: categoryPattern },
    ],
  };
};

const buildTextSearchCondition = (keyword = "") => {
  const cleaned = String(keyword).trim();
  if (!cleaned) return null;

  const searchRegex = new RegExp(cleaned, "i");
  return {
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { category: searchRegex },
      { categories: searchRegex },
      { subCategory: searchRegex },
      { subCategories: searchRegex },
    ],
  };
};

const getProductArrayValue = (value) => {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [value];
};

const getGridFSBucket = async () => {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connection.asPromise();
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "fs",
  });
};

const extractGridFsFileIds = (images = []) => {
  const ids = [];

  images.forEach((image) => {
    const value = String(image || "").trim();
    const match = value.match(/\/api\/uploads\/images\/([a-fA-F0-9]{24})$/);
    if (match?.[1] && mongoose.Types.ObjectId.isValid(match[1])) {
      ids.push(match[1]);
      return;
    }

    if (mongoose.Types.ObjectId.isValid(value)) {
      ids.push(value);
    }
  });

  return [...new Set(ids)];
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
    const andConditions = [];
    const sortQuery = String(req.query.sort || "newest").trim();

    const keywordCondition = buildTextSearchCondition(req.query.keyword || req.query.q || "");
    if (keywordCondition) {
      andConditions.push(keywordCondition);
    }

    if (req.query.category) {
      const categoryFilter = buildCategoryFilter(req.query.category);
      if (categoryFilter) {
        andConditions.push(categoryFilter);
      }
    }

    if (req.query.subCategory) {
      const subCategoryPattern = buildFlexibleCategoryPattern(req.query.subCategory);
      if (subCategoryPattern) {
        andConditions.push({
          $or: [{ subCategory: subCategoryPattern }, { subCategories: subCategoryPattern }],
        });
      }
    }

    if (req.query.featured === "true") {
      andConditions.push({ featured: true });
    }

    if (req.query.bestSeller === "true" || sortQuery === "best_seller") {
      andConditions.push({ bestSeller: true });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const total = await Product.countDocuments(filter);
    const pages = limit > 0 ? Math.ceil(total / limit) : total > 0 ? 1 : 0;

    const pipeline = [];
    pipeline.push({ $match: filter });

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
    const productIds = products.map((product) => product._id);
    const reviewStats = productIds.length
      ? await Review.aggregate([
          { $match: { product: { $in: productIds } } },
          {
            $group: {
              _id: "$product",
              averageRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ])
      : [];
    const reviewStatsByProductId = new Map(
      reviewStats.map((stats) => [String(stats._id), stats])
    );

    res.json({
      data: products.map((product) => {
        const stats = reviewStatsByProductId.get(String(product._id));
        return normalize({
          ...product,
          rating: stats ? Number(stats.averageRating.toFixed(1)) : product.rating,
          numReviews: stats ? stats.reviewCount : product.numReviews,
        });
      }),
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

router.post("/", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name || !payload.price) {
      return res.status(400).json({ message: "name and price are required" });
    }

    const product = await Product.create({
      name: payload.name,
      brand: "DYVA",
      description: payload.description || "",
      category: getPrimaryValue(payload.category, normalizeStringList(payload.categories)),
      categories: normalizeStringList(getProductArrayValue(payload.categories).length ? payload.categories : payload.category),
      subCategory: getPrimaryValue(payload.subCategory, normalizeStringList(payload.subCategories)),
      subCategories: normalizeStringList(getProductArrayValue(payload.subCategories).length ? payload.subCategories : payload.subCategory),
      price: Number(payload.price) || 0,
      salePrice: payload.salePrice === "" || payload.salePrice == null ? null : Number(payload.salePrice),
      stock: Number(payload.stock) || 0,
      rating: Number(payload.rating) || 0,
      numReviews: Number(payload.numReviews) || 0,
      sold: Number(payload.sold) || 0,
      images: Array.isArray(payload.images) ? payload.images : [],
      featured: Boolean(payload.featured),
      bestSeller: Boolean(payload.bestSeller),
      comingSoon: Boolean(payload.comingSoon),
      availableRegions: normalizeStringList(payload.availableRegions),
    });

    return res.status(201).json(normalize(product.toObject()));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = req.body || {};
    const product = await Product.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { id: req.params.id }] },
      {
        $set: {
          name: payload.name,
          brand: "DYVA",
          description: payload.description,
          category: getPrimaryValue(payload.category, normalizeStringList(payload.categories)),
          categories: normalizeStringList(getProductArrayValue(payload.categories).length ? payload.categories : payload.category),
          subCategory: getPrimaryValue(payload.subCategory, normalizeStringList(payload.subCategories)),
          subCategories: normalizeStringList(getProductArrayValue(payload.subCategories).length ? payload.subCategories : payload.subCategory),
          price: payload.price === "" || payload.price == null ? 0 : Number(payload.price),
          salePrice: payload.salePrice === "" || payload.salePrice == null ? null : Number(payload.salePrice),
          stock: payload.stock === "" || payload.stock == null ? 0 : Number(payload.stock),
          rating: payload.rating === "" || payload.rating == null ? 0 : Number(payload.rating),
          numReviews: payload.numReviews === "" || payload.numReviews == null ? 0 : Number(payload.numReviews),
          sold: payload.sold === "" || payload.sold == null ? 0 : Number(payload.sold),
          images: Array.isArray(payload.images) ? payload.images : [],
          featured: Boolean(payload.featured),
          bestSeller: Boolean(payload.bestSeller),
          comingSoon: Boolean(payload.comingSoon),
          availableRegions: normalizeStringList(payload.availableRegions),
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(normalize(product));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ _id: req.params.id }, { id: req.params.id }],
    }).lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageIds = extractGridFsFileIds(product.images);
    if (imageIds.length > 0) {
      const bucket = await getGridFSBucket();
      await Promise.allSettled(imageIds.map((fileId) => bucket.delete(new mongoose.Types.ObjectId(fileId))));
    }

    await Product.deleteOne({
      $or: [{ _id: req.params.id }, { id: req.params.id }],
    });

    return res.json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
