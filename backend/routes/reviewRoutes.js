const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");

const normalizeReview = (review) => ({
  ...review,
  id: review.id || review._id?.toString(),
  productId:
    review.productId ||
    review.product?._id?.toString() ||
    review.product?.toString?.() ||
    review.product,
});

const formatReview = (review) => {
  const plain = typeof review?.toObject === "function" ? review.toObject() : review;
  return normalizeReview(plain);
};

router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.productId) {
      filter.product = req.query.productId;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .populate("product", "name images brand category")
      .lean();

    res.json(reviews.map((review) => normalizeReview(review)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { productId, userName, rating, comment } = req.body || {};

    if (!productId || !userName || !rating || !comment) {
      return res.status(400).json({ message: "productId, userName, rating and comment are required" });
    }

    const product = await Product.findOne({
      $or: [{ _id: productId }, { id: productId }],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = await Review.create({
      product: product._id,
      userName,
      rating: Number(rating),
      comment,
    });

    const [reviewStats] = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    await Product.findByIdAndUpdate(product._id, {
      rating: Number((reviewStats?.averageRating || 0).toFixed(1)),
      numReviews: reviewStats?.reviewCount || 0,
    });

    const populated = await Review.findById(review._id)
      .populate("product", "name images brand category")
      .lean();

    res.status(201).json(formatReview(populated));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
