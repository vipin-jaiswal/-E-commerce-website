import { API_BASE } from '../utils/constants';

// Keep address requests on the same /api base path as the rest of the client.
const API_BASE_URL = API_BASE;

function getToken() {
  // Adjust this if your auth token is stored under a different key
  // or already exposed via your useAuth hook / AuthContext.
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message = body?.message || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = res.status;
    error.errors = body?.errors;
    throw error;
  }

  return body;
}

export async function getAddresses() {
  return request('/address');
}

export async function getAddressById(id) {
  return request(`/address/${id}`);
}

export async function createAddress(payload) {
  return request('/address', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAddress(id, payload) {
  return request(`/address/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAddress(id) {
  return request(`/address/${id}`, { method: 'DELETE' });
}

export async function setDefault(id) {
  return request(`/address/default/${id}`, { method: 'PATCH' });
}

export async function verifyAddress(payload) {
  const res = await request('/address/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res; // { success, verified, match }
}

export default {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault,
  verifyAddress,
};
