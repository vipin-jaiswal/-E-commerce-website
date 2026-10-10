const express = require("express");
const {
  fetchProducts,
  fetchProduct,
  fetchStorefrontContent,
  fetchStorePolicies,
  fetchAllStorePolicies,
  fetchCart,
  validateCartInventory,
  createCart,
  addCartLines,
  updateCartDiscountCodes,
  updateCartLines,
  removeCartLines,
  getVariantInventory,
  updateCartDeliveryAddress,
  updateCartBuyerIdentity,
  findOrderByTrackingId,
} = require("../services/shopifyService");
const authMiddleware = require("../middleware/authMiddleware");
const CartOwnership = require("../models/CartOwnership");

const router = express.Router();

const optionalAuthMiddleware = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authMiddleware(req, res, next);
};

const decodeValue = (value) => {
  if (typeof value !== "string") return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getCartId = (request) => decodeValue(request.query.cartId || request.body?.cartId);
const getLineId = (request) => decodeValue(request.query.lineId || request.body?.lineId);

const isCartNotFoundError = (error) =>
  /cart.*(not found|does not exist|invalid)|invalid.*cart/i.test(error.message || "");

const handleError = (res, error) => {
  console.error("Shopify API request failed:", error.message);
  const isConfigurationError = error.message?.includes("SHOPIFY_STOREFRONT_TOKEN");
  const isNotFound = isCartNotFoundError(error);
  return res.status(isNotFound ? 404 : isConfigurationError ? 503 : 502).json({
    success: false,
    message: isNotFound
      ? "Shopify cart not found"
      : isConfigurationError
      ? "Shopify cart is not configured. Add SHOPIFY_STOREFRONT_TOKEN to backend/.env and restart the backend."
      : error.message || "Shopify request failed",
    errors: [error.message].filter(Boolean),
  });
};

router.get("/track-order", authMiddleware, async (req, res) => {
  const trackingId = String(req.query.trackingId || "").trim();
  if (!trackingId || trackingId.length > 100) {
    return res.status(400).json({ success: false, message: "A valid tracking ID is required." });
  }

  try {
    const order = await findOrderByTrackingId(trackingId, req.user.shopifyCustomerId);
    if (!order) return res.status(404).json({ success: false, message: "No order was found for that tracking ID." });
    return res.json({ success: true, data: order });
  } catch (error) {
    return handleError(res, error);
  }
});

router.get("/products", async (req, res) => {
  try {
    const first = Math.min(Math.max(Number(req.query.limit) || 24, 1), 100);
    const query = String(req.query.keyword || req.query.q || req.query.category || "").trim();
    const result = await fetchProducts({ first, query });
    console.log(`Shopify products fetched successfully. Products found: ${result.products.length}`);
    return res.json({ data: result.products, total: result.total, pages: 1 });
  } catch (error) {
    return handleError(res, error);
  }
});

router.get("/products/:handle", async (req, res) => {
  try {
    const product = await fetchProduct(req.params.handle);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json({ data: product });
  } catch (error) {
    return handleError(res, error);
  }
});

router.get("/content", async (req, res) => {
  try {
    return res.json({ success: true, data: await fetchStorefrontContent() });
  } catch (error) {
    if (error.message?.includes("unauthenticated_read_metaobjects")) {
      return res.json({
        success: true,
        data: { announcement: null, banners: [] },
      });
    }
    return handleError(res, error);
  }
});

router.get("/policies/shipping-returns", async (_req, res) => {
  try {
    return res.json({ success: true, data: await fetchStorePolicies() });
  } catch (error) {
    const message = error.message || "Shopify policy request failed";
    const missingPolicyScope = /read_legal_policies|access denied|access scope/i.test(message);
    console.error("Shopify policy request failed:", message);
    return res.status(missingPolicyScope ? 503 : 502).json({
      success: false,
      message: missingPolicyScope
        ? "The Shopify app needs the read_legal_policies access scope. Update the app scopes and reauthorize the app."
        : message,
      errors: [message],
    });
  }
});

router.get("/policies/:kind", async (req, res) => {
  const policyTypes = {
    privacy: "PRIVACY_POLICY",
    terms: "TERMS_OF_SERVICE",
  };
  const requestedType = policyTypes[String(req.params.kind).toLowerCase()];
  if (!requestedType) return res.status(404).json({ success: false, message: "Policy not found." });
  try {
    const policies = await fetchAllStorePolicies();
    return res.json({ success: true, data: policies.filter((policy) => policy.type === requestedType) });
  } catch (error) {
    const message = error.message || "Shopify policy request failed";
    const missingPolicyScope = /read_legal_policies|access denied|access scope/i.test(message);
    console.error("Shopify policy request failed:", message);
    return res.status(missingPolicyScope ? 503 : 502).json({
      success: false,
      message: missingPolicyScope
        ? "The Shopify app needs the read_legal_policies access scope. Update the app scopes and reauthorize the app."
        : "Store policies could not be loaded right now.",
    });
  }
});

router.get("/cart", async (req, res) => {
  try {
    const cartId = getCartId(req);
    if (!cartId) return res.status(400).json({ success: false, message: "cartId is required", errors: [] });
    const cart = await fetchCart(cartId);
    if (!cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    return res.json({ success: true, checkoutUrl: cart.checkoutUrl, cart, data: cart });
  } catch (error) {
    if (isCartNotFoundError(error)) {
      return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [error.message] });
    }
    return handleError(res, error);
  }
});

router.get("/cart/inventory", async (req, res) => {
  try {
    const cartId = getCartId(req);
    if (!cartId) return res.status(400).json({ success: false, message: "cartId is required", errors: [] });
    const result = await validateCartInventory(cartId);
    if (!result.cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    if (result.issues.length) {
      return res.status(409).json({
        success: false,
        message: "Some products are no longer available in the requested quantity.",
        issues: result.issues,
      });
    }
    return res.json({ success: true, data: { cart: result.cart, issues: [] } });
  } catch (error) {
    return handleError(res, error);
  }
});

router.post("/cart", optionalAuthMiddleware, async (req, res) => {
  try {
    const cartId = getCartId(req);
    if (cartId && req.user) {
      const existingOwner = await CartOwnership.findOne({ cartId }).select("customerId").lean();
      if (existingOwner && String(existingOwner.customerId) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: "This cart is not available to this account." });
      }
    }
    const { variantId, quantity = 1, lines } = req.body || {};
    const requestedLines = lines || (variantId ? [{ merchandiseId: variantId, quantity: Number(quantity) }] : []);
    if (!requestedLines.length) return res.status(400).json({ message: "At least one Shopify variant is required" });

    for (const line of requestedLines) {
      const available = await getVariantInventory(line.merchandiseId);
      if (available !== null && Number(line.quantity) > available) {
        return res.status(409).json({
          success: false,
          message: available <= 0 ? "This product is out of stock." : `Only ${available} item(s) are available.`,
          issues: [{ variantId: line.merchandiseId, requested: Number(line.quantity), available }],
        });
      }
    }

    const cart = cartId
      ? await addCartLines(cartId, requestedLines)
      : await createCart(requestedLines);
    if (!cartId && req.user) {
      const associated = await CartOwnership.associateWithCustomer(cart.id, req.user._id);
      if (!associated) {
        return res.status(403).json({ success: false, message: "This cart is not available to this account." });
      }
    }
    return res.status(cartId ? 200 : 201).json({ success: true, data: cart });
  } catch (error) {
    return handleError(res, error);
  }
});

router.post("/cart/discount", async (req, res) => {
  try {
    const cartId = getCartId(req);
    const code = typeof req.body?.code === "string" ? req.body.code.trim() : "";
    if (!cartId) return res.status(400).json({ success: false, message: "cartId is required" });
    if (code.length > 100) return res.status(400).json({ success: false, message: "Discount code is too long" });

    const cart = await updateCartDiscountCodes(cartId, code ? [code] : []);
    const discount = cart.discountCodes.find((item) => item.code.toLowerCase() === code.toLowerCase());
    return res.json({
      success: true,
      data: cart,
      discount: code ? { code, applicable: Boolean(discount?.applicable) } : null,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

router.patch("/cart/items", async (req, res) => {
  try {
    const cartId = getCartId(req);
    const lineId = getLineId(req);
    const { quantity } = req.body || {};
    if (!cartId || !lineId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({ message: "lineId and a positive integer quantity are required" });
    }
    const currentCart = await fetchCart(cartId);
    if (!currentCart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    const item = currentCart.items.find((cartItem) => cartItem.cartItemId === lineId);
    if (!item) return res.status(404).json({ success: false, message: "Cart item not found", errors: [] });
    const available = await getVariantInventory(item.variantId);
    // Always allow reducing an existing cart line, even when current inventory
    // has since fallen below the quantity already in the cart.
    if (available !== null && Number(quantity) > Number(item.quantity) && Number(quantity) > available) {
      return res.status(409).json({
        success: false,
        message: available <= 0 ? "This product is out of stock." : `Only ${available} item(s) are available.`,
        issues: [{ variantId: item.variantId, requested: Number(quantity), available }],
      });
    }
    const cart = await updateCartLines(cartId, [{ id: lineId, quantity: Number(quantity) }]);
    return res.json({ success: true, data: cart });
  } catch (error) {
    return handleError(res, error);
  }
});

router.delete("/cart/items", async (req, res) => {
  try {
    const cartId = getCartId(req);
    const lineId = getLineId(req);
    if (!cartId || !lineId) return res.status(400).json({ success: false, message: "cartId and lineId are required", errors: [] });
    const cart = await removeCartLines(cartId, [lineId]);
    return res.json({ success: true, data: cart });
  } catch (error) {
    return handleError(res, error);
  }
});

  router.delete("/cart", async (req, res) => {
    try {
      const cartId = getCartId(req);
      if (!cartId) return res.status(400).json({ success: false, message: "cartId is required", errors: [] });
      const cart = await fetchCart(cartId);
      if (!cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
      const nextCart = cart.items.reduce(
        (promise, item) => promise.then(() => removeCartLines(cartId, [item.cartItemId])),
        Promise.resolve(cart)
      );
      return res.json({ success: true, data: await nextCart });
    } catch (error) {
      return handleError(res, error);
    }
  });

router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const { cartId, address } = req.body || {};
    if (!cartId || !address) return res.status(400).json({ success: false, message: "A cart and delivery address are required.", errors: [] });
    if (!await CartOwnership.isOwnedBy(cartId, req.user._id)) {
      return res.status(403).json({ success: false, message: "This cart is not available to this account." });
    }
    const inventory = await validateCartInventory(cartId);
    if (!inventory.cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    if (inventory.issues.length) return res.status(409).json({ success: false, message: "Some products are unavailable in the requested quantity.", issues: inventory.issues });
    await updateCartBuyerIdentity(cartId, req.user);
    await updateCartDeliveryAddress(cartId, address);

    // Fetch Shopify's current cart URL after all cart updates, immediately before redirect.
    const cart = await fetchCart(cartId);
    if (!cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    if (!cart.checkoutUrl) return res.status(400).json({ success: false, message: "Shopify did not return a checkout URL for this cart", errors: [] });

    let parsedCheckoutUrl;
    try {
      parsedCheckoutUrl = new URL(cart.checkoutUrl);
    } catch {
      throw new Error("Shopify returned an invalid checkout URL");
    }
    if (parsedCheckoutUrl.protocol !== "https:") {
      throw new Error("Shopify returned a checkout URL that does not use HTTPS");
    }

    console.info("[shopify][checkout] Checkout URL prepared.");
    return res.json({ success: true, data: { cartId: cart.id, checkoutUrl: cart.checkoutUrl } });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
