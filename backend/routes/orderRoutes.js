const express = require("express");
const { createCodOrder, getCustomerOrder, getCustomerOrderIdMap, isShopifyCartId } = require("../services/shopifyService");
const authMiddleware = require("../middleware/authMiddleware");
const CartOwnership = require("../models/CartOwnership");

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+91[6-9]\d{9}$/;

function normalizeIndianPhone(phone) {
  if (phone === null || phone === undefined) {
    return null;
  }

  let value = String(phone).trim();

  value = value.replace(/[^\d+]/g, "");

  if (/^\+91\d{10}$/.test(value)) {
    return value;
  }

  if (/^91\d{10}$/.test(value)) {
    return `+${value}`;
  }

  if (/^0\d{10}$/.test(value)) {
    return `+91${value.slice(1)}`;
  }

  if (/^[6-9]\d{9}$/.test(value)) {
    return `+91${value}`;
  }

  return null;
}

router.get("/ids", authMiddleware, async (req, res) => {
  try {
    const result = await getCustomerOrderIdMap(req.user.shopifyCustomerId);
    if (!result.authenticated) return res.status(401).json({ success: false, message: "Your session has expired. Please sign in again." });
    return res.json({ success: true, ids: result.ids });
  } catch (error) {
    console.error("[orders] order ID lookup failed:", error.message);
    return res.status(502).json({ success: false, message: "Unable to load order IDs." });
  }
});

router.get("/details", authMiddleware, async (req, res) => {
  const orderId = String(req.query.orderId || "");
  console.info("[orders][details] received orderId:", orderId || "[empty]");
  if (!/^#?\d+$/.test(orderId)) {
    return res.status(400).json({ success: false, message: "A valid order ID is required." });
  }

  try {
    const result = await getCustomerOrder(req.user.shopifyCustomerId, orderId);
    if (!result.authenticated) {
      return res.status(401).json({ success: false, message: "Your session has expired. Please sign in again." });
    }
    if (!result.order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, order: result.order });
  } catch (error) {
    console.error("[orders] detail lookup failed:", error.message);
    return res.status(502).json({ success: false, message: "Unable to load order details. Please try again." });
  }
});

const splitName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" "),
  };
};

const validateRequest = (body) => {
  const customer = body?.customer || {};
  const shippingAddress = body?.shippingAddress || {};
  const normalizedPhone = normalizeIndianPhone(customer.phone);
  const normalizedShippingPhone = shippingAddress.phone
    ? normalizeIndianPhone(shippingAddress.phone)
    : normalizedPhone;
  const normalizedAlternativePhone = shippingAddress.alternativePhone
    ? normalizeIndianPhone(shippingAddress.alternativePhone)
    : "";
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || body?.address?.name;
  const parsedName = splitName(name);
  const errors = [];

  if (!isShopifyCartId(body?.cartId)) errors.push("A valid Shopify cart is required.");
  if (!parsedName.firstName || parsedName.firstName.length > 100) errors.push("A valid customer name is required.");
  if (!emailPattern.test(String(customer.email || "").trim()) || String(customer.email).length > 254) errors.push("A valid email address is required.");
  if (!phonePattern.test(normalizedPhone || "") || normalizedShippingPhone !== normalizedPhone) {
    errors.push("Please enter a valid 10-digit Indian mobile number.");
  }
  if (shippingAddress.alternativePhone && !phonePattern.test(normalizedAlternativePhone || "")) {
    errors.push("Please enter a valid alternative mobile number.");
  }
  for (const [key, label, max] of [
    ["address1", "Address line 1", 200],
    ["city", "City", 100],
    ["state", "State", 100],
    ["postalCode", "Postal code", 20],
  ]) {
    const value = String(shippingAddress[key] || "").trim();
    if (!value || value.length > max) errors.push(`${label} is invalid.`);
  }
  if (shippingAddress.address2 && String(shippingAddress.address2).length > 200) errors.push("Address line 2 is too long.");
  return {
    errors,
    cartId: body?.cartId,
    customer: { ...customer, firstName: parsedName.firstName, lastName: parsedName.lastName, phone: normalizedPhone },
    shippingAddress: { ...shippingAddress, phone: normalizedPhone, alternativePhone: normalizedAlternativePhone },
  };
};

router.post("/cod", authMiddleware, async (req, res) => {
  const requestedCartId = req.body?.cartId;
  if (requestedCartId) {
    try {
      if (!await CartOwnership.isOwnedBy(requestedCartId, req.user._id)) {
        return res.status(403).json({ success: false, message: "This cart is not available to this account." });
      }
    } catch {
      return res.status(503).json({ success: false, message: "Unable to verify cart ownership right now." });
    }
  }
  const [firstName, ...lastNameParts] = String(req.user.name || '').trim().split(/\s+/);
  const trustedBody = {
    ...req.body,
    customer: {
      ...req.body?.customer,
      firstName: firstName || '',
      lastName: lastNameParts.join(' '),
      email: req.user.email,
      phone: req.user.phone || null,
      shopifyCustomerId: req.user.shopifyCustomerId || null,
    },
    shippingAddress: {
      ...req.body?.shippingAddress,
      phone: req.user.phone || null,
    },
  };
  const validated = validateRequest(trustedBody);
  if (validated.errors.length) {
    return res.status(400).json({ success: false, message: validated.errors[0], errors: validated.errors });
  }
  if (String(process.env.COD_ENABLED || "true").toLowerCase() === "false") {
    return res.status(403).json({ success: false, message: "Cash on Delivery is currently unavailable." });
  }

  try {
    const order = await createCodOrder(validated);
    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderId: order.orderId,
        amount: order.amount,
        paymentMethod: "Cash on Delivery",
        paymentStatus: "PENDING",
        fulfillmentStatus: "UNFULFILLED",
        customerFacingStatus: "ORDERED",
        customer: order.customer,
        shippingAddress: order.shippingAddress,
        lineItems: order.lineItems,
      },
    });
  } catch (error) {
    console.error("[orders][cod] request failed:", error.message);
    const status = error.code === "INVALID_CART_ID" ? 400
      : error.code === "CART_ORDER_OWNERSHIP" ? 403
      : error.code === "CART_NOT_FOUND" ? 404
      : error.code === "EMPTY_CART" ? 409
      : error.code === "INVENTORY_UNAVAILABLE" ? 409
      : 502;
    return res.status(status).json({
      success: false,
      message: error.code === "INVENTORY_UNAVAILABLE"
        ? "Some products are unavailable in the requested quantity."
        : error.code === "CART_NOT_FOUND"
          ? "Shopify cart not found."
          : error.code === "EMPTY_CART"
            ? "Your Shopify cart is empty."
            : "Unable to place your order. Please try again.",
      ...(error.issues ? { issues: error.issues } : {}),
    });
  }
});

module.exports = router;
