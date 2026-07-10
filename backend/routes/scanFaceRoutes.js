const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { scanFace } = require("../controllers/scanFaceController");

const router = express.Router();

// Make sure backend/uploads exists before multer tries to write into it
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store uploaded images in backend/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Only accept image files, cap size at 10MB
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// POST /api/scan-face
router.post("/", upload.single("image"), scanFace);

module.exports = router;
