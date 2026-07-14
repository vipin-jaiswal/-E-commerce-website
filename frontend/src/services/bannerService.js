import api from './api';

export const bannerService = {
  listLive: () => api.get('/banners').then((response) => response.data?.data ?? []),
};
