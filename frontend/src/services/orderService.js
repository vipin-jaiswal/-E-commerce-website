import api from './api';

const unwrap = (response) => response.data?.data ?? response.data ?? [];

export const orderService = {
  create: ({ addressId, paymentMethod, items }) =>
    api.post('/orders', { addressId, paymentMethod, items }).then(unwrap),
  getMine: () => api.get('/orders/my').then(unwrap),
  getAll: () => api.get('/orders').then(unwrap),
  getById: (id) => api.get(`/orders/${id}`).then(unwrap),
  cancel: (id) => api.patch(`/orders/my/${id}/cancel`).then(unwrap),
};
