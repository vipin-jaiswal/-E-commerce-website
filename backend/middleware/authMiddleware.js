const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ success: false, message: "Please sign in." });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    return res.status(401).json({ success: false, message: "Your session is invalid or has expired. Please sign in again." });
  }

  if (typeof payload.customerId !== "string") {
    return res.status(401).json({ success: false, message: "Your session is invalid. Please sign in again." });
  }

  try {
    const customer = await Customer.findById(payload.customerId).select("-password");
    if (!customer) {
      return res.status(401).json({ success: false, message: "Your session has expired. Please sign in again." });
    }
    req.user = customer;
    return next();
  } catch {
    return res.status(500).json({ success: false, message: "Unable to authenticate your session right now." });
  }
};

module.exports = authMiddleware;
