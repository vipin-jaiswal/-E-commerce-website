import api from './api';

const unwrapCart = (response) => response.data?.data ?? response.data ?? { items: [], totalPrice: 0 };

export const cartService = {
  get:    () => api.get('/cart').then(unwrapCart),
  add:    (productId, quantity = 1) => api.post('/cart', { productId, quantity }).then(unwrapCart),
  update: (itemId, quantity) => api.put(`/cart/${itemId}`, { quantity }).then(unwrapCart),
  remove: (itemId) => api.delete(`/cart/${itemId}`).then(unwrapCart),
  clear:  () => api.delete('/cart/clear').then((response) => response.data ?? {}),
};
