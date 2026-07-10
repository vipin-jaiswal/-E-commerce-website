import api from './api';

const unwrap = (response) => response.data?.user ? response.data : response.data?.data ?? response.data;

export const authService = {
  register: async (data) => unwrap(await api.post('/auth/register', data)),
  login: async (data) => unwrap(await api.post('/auth/login', data)),
  sendEmailOtp: async (data) => unwrap(await api.post('/auth/email/send-otp', data)),
  verifyEmailOtp: async (data) => unwrap(await api.post('/auth/email/verify-otp', data)),
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data?.user ?? null;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
};
