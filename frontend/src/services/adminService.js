import api from './api';

const unwrapItem = (response) => response.data?.data ?? response.data ?? null;
const unwrapList = (response) => response.data?.data ?? response.data ?? [];
const unwrapUpload = (response) => response.data?.data ?? response.data ?? [];

export const adminService = {
  listProducts: (params) => api.get('/products', { params }).then(unwrapList),
  createProduct: (payload) => api.post('/products', payload).then(unwrapItem),
  updateProduct: (id, payload) => api.put(`/products/${id}`, payload).then(unwrapItem),
  deleteProduct: (id) => api.delete(`/products/${id}`).then((response) => response.data ?? {}),
  listBanners: () => api.get('/banners/admin/all').then(unwrapList),
  createBanner: (payload) => api.post('/banners', payload).then(unwrapItem),
  updateBanner: (id, payload) => api.put(`/banners/${id}`, payload).then(unwrapItem),
  deleteBanner: (id) => api.delete(`/banners/${id}`).then((response) => response.data ?? {}),
  listOrders: (params) => api.get('/orders/admin/all', { params }).then(unwrapList),
  updateOrderStatus: (id, status) => api.patch(`/orders/admin/${id}/status`, { status }).then(unwrapItem),
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post('/uploads/images', formData).then(unwrapUpload);
  },
};
