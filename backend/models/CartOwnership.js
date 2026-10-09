const mongoose = require("mongoose");

const cartOwnershipSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    cartId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

cartOwnershipSchema.statics.isOwnedBy = async function (cartId, customerId) {
  return Boolean(await this.exists({ cartId, customerId }));
};

cartOwnershipSchema.statics.associateWithCustomer = async function (cartId, customerId) {
  const existing = await this.findOne({ cartId }).select("customerId").lean();
  if (existing) return String(existing.customerId) === String(customerId);

  try {
    await this.create({ cartId, customerId });
    return true;
  } catch (error) {
    if (error.code !== 11000) throw error;
    const raced = await this.findOne({ cartId }).select("customerId").lean();
    return Boolean(raced && String(raced.customerId) === String(customerId));
  }
};

module.exports = mongoose.model("CartOwnership", cartOwnershipSchema);
