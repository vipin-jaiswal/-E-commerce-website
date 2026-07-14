const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const scanFaceRoutes = require("./routes/scanFaceRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const bannerRoutes = require('./routes/bannerRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use('/api/uploads', uploadRoutes);
app.use("/api/scan-face", scanFaceRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use('/api/banners', bannerRoutes);

module.exports = app;
