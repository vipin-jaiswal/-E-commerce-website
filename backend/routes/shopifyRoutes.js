const express = require("express");
const {
  fetchProducts,
  fetchProduct,
  fetchCart,
  validateCartInventory,
  createCart,
  addCartLines,
  updateCartLines,
  removeCartLines,
  getVariantInventory,
  validateCustomerAccessToken,
  updateCartDeliveryAddress,
  updateCartBuyerIdentity,
} = require("../services/shopifyService");

const router = express.Router();

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
const getCustomerToken = (request) => request.headers.authorization?.replace(/^Bearer\s+/i, "");

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

router.post("/cart", async (req, res) => {
  try {
    const cartId = getCartId(req);
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
    return res.status(cartId ? 200 : 201).json({ success: true, data: cart });
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
    if (available !== null && Number(quantity) > available) {
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

router.post("/checkout", async (req, res) => {
  try {
    const customerToken = getCustomerToken(req);
    if (!await validateCustomerAccessToken(customerToken)) {
      return res.status(401).json({ success: false, message: "Please sign in before placing your order.", errors: [] });
    }
    const { cartId, address } = req.body || {};
    if (!cartId || !address) return res.status(400).json({ success: false, message: "A cart and delivery address are required.", errors: [] });
    const inventory = await validateCartInventory(cartId);
    if (!inventory.cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    if (inventory.issues.length) return res.status(409).json({ success: false, message: "Some products are unavailable in the requested quantity.", issues: inventory.issues });
    await updateCartBuyerIdentity(cartId, customerToken);
    const cart = await updateCartDeliveryAddress(cartId, address);
    if (!cart) return res.status(404).json({ success: false, message: "Shopify cart not found", errors: [] });
    if (!cart.checkoutUrl) return res.status(400).json({ success: false, message: "A valid Shopify cart is required", errors: [] });
    return res.json({ success: true, data: { checkoutUrl: cart.checkoutUrl } });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
