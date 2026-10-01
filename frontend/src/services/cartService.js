import api from './api';

const unwrapCart = (response) => response.data?.data ?? response.data ?? { items: [], totalPrice: 0 };
const cartQuery = (cartId) => `?cartId=${encodeURIComponent(cartId)}`;
const lineQuery = (cartId, lineId) => `${cartQuery(cartId)}&lineId=${encodeURIComponent(lineId)}`;
const getCart = (response) => response.data?.cart ?? response.data?.data ?? response.data;

export const cartService = {
  get: (cartId) => api.get(`/shopify/cart${cartQuery(cartId)}`).then(unwrapCart),
  getCartCheckoutUrl: (cartId) =>
    api.get(`/shopify/cart${cartQuery(cartId)}`).then((response) => ({
      checkoutUrl: response.data?.checkoutUrl,
      cart: getCart(response),
    })),
  validateInventory: (cartId) =>
    api.get(`/shopify/cart/inventory${cartQuery(cartId)}`).then((response) => response.data?.data),
  add: (cartId, variantId, quantity = 1) =>
    api.post('/shopify/cart', { cartId, variantId, quantity }).then(unwrapCart),
  updateDiscountCode: (cartId, code) =>
    api.post('/shopify/cart/discount', { cartId, code }).then((response) => ({
      cart: response.data?.data,
      discount: response.data?.discount,
    })),
  update: (cartId, lineId, quantity) =>
    api.patch(`/shopify/cart/items${cartQuery(cartId)}`, { lineId, quantity }).then(unwrapCart),
  remove: (cartId, lineId) =>
    api.delete(`/shopify/cart/items${lineQuery(cartId, lineId)}`).then(unwrapCart),
  clear: (cartId) => api.delete(`/shopify/cart${cartQuery(cartId)}`).then(unwrapCart),
  checkout: (cartId, address) => api.post('/shopify/checkout', { cartId, address }).then((response) => response.data?.data ?? response.data),
};
