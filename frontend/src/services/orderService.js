import api from './api';

const unwrap = (response) => response.data?.data ?? response.data ?? [];

export const orderService = {
  create: ({ shippingAddress, paymentMethod }) =>
    api.post('/orders', { shippingAddress, paymentMethod }).then(unwrap),
  getMine: () => api.get('/orders/my').then(unwrap),
  getAll: () => api.get('/orders').then(unwrap),
  getById: (id) => api.get(`/orders/${id}`).then(unwrap),
};
