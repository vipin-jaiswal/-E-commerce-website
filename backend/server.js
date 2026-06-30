const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);

module.exports = app;