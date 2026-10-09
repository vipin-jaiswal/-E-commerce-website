import axios from 'axios';
import { API_BASE } from '../utils/constants';

export const clearCustomerScopedState = () => {
  localStorage.removeItem('token');
  for (const key of ['dyvaSavedAddresses', 'dyvaAddressOwner', 'dyvaCheckoutAddress', 'dyvaCheckoutAddressOwner', 'dyvaCheckoutPayment', 'shopifyCartId', 'dyvaProfileDetails', 'account', 'lumiere_wishlist']) localStorage.removeItem(key);
  for (const key of ['dyvaCheckoutAddress', 'dyvaCheckoutAddressOwner', 'dyvaCheckoutPayment', 'dyvaCodOrder']) sessionStorage.removeItem(key);
  window.dispatchEvent(new Event('dyva:customer-changed'));
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach the DYVA JWT to authenticated API requests.
api.interceptors.request.use((config) => {
  const customerToken = localStorage.getItem('token');
  if (customerToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${customerToken}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle 401 globally without redirect conflicts
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const requestUrl = err.config?.url || '';
    const isCustomerAuth = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');

    if (err.response?.status === 401) {
      if (!isCustomerAuth) {
        clearCustomerScopedState();
        if (!['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
          window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
