const express = require("express");
const { createProductReview, listProductReviews } = require("../services/reviewService");

const router = express.Router();
const recentSubmissions = new Map();
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{0,254}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get("/", async (req, res) => {
  const productHandle = String(req.query.productHandle || "").trim();
  if (productHandle && !HANDLE_PATTERN.test(productHandle)) {
    return res.status(400).json({ success: false, message: "A valid product is required." });
  }

  try {
    return res.json({ success: true, data: await listProductReviews(productHandle) });
  } catch (error) {
    console.error("Unable to load product reviews:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load reviews right now." });
  }
});

router.post("/", async (req, res) => {
  const productHandle = String(req.body?.productHandle || "").trim();
  const author = String(req.body?.author || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const title = String(req.body?.title || "").trim();
  const body = String(req.body?.body || "").trim();
  const rating = Number(req.body?.rating);

  if (!HANDLE_PATTERN.test(productHandle)) {
    return res.status(400).json({ success: false, message: "A valid product is required." });
  }
  if (author.length < 2 || author.length > 80) {
    return res.status(400).json({ success: false, message: "Enter a name between 2 and 80 characters." });
  }
  if (email && (email.length > 254 || !EMAIL_PATTERN.test(email))) {
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Choose a rating from 1 to 5 stars." });
  }
  if (title.length > 120 || body.length < 10 || body.length > 2000) {
    return res.status(400).json({ success: false, message: "Add a review between 10 and 2,000 characters." });
  }

  const clientKey = req.ip || "unknown";
  const previousSubmission = recentSubmissions.get(clientKey) || 0;
  if (Date.now() - previousSubmission < 30_000) {
    return res.status(429).json({ success: false, message: "Please wait before sending another review." });
  }

  try {
    const review = await createProductReview({ productHandle, author, rating, title, body });
    recentSubmissions.set(clientKey, Date.now());
    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error("Unable to save product review:", error.message);
    return res.status(500).json({ success: false, message: "Unable to save your review right now." });
  }
});

module.exports = router;
