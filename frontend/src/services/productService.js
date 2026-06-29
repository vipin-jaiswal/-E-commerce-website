import api from './api';

const unwrapList = (response) => response.data?.data ?? response.data ?? [];
const unwrapItem = (response) => response.data?.data ?? response.data ?? null;

export const productService = {
  getAll: (params) => api.get('/products', { params }).then(unwrapList),
  getFeatured: () => api.get('/products/featured').then(unwrapList),
  getById: (id) => api.get(`/products/${id}`).then(unwrapItem),
};
