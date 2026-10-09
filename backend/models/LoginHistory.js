const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    loginAt: { type: Date, default: Date.now, required: true },
    ipAddress: { type: String, default: null, maxlength: 100 },
    userAgent: { type: String, default: null, maxlength: 500 },
    success: { type: Boolean, required: true },
  },
  { timestamps: false }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
