// Adjust API_BASE_URL to match your existing environment variable
// (e.g. import.meta.env.VITE_API_URL) if your project already defines one.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  const res = await request('/address');
  return res.data;
}

export async function getAddressById(id) {
  const res = await request(`/address/${id}`);
  return res.data;
}

export async function createAddress(payload) {
  const res = await request('/address', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateAddress(id, payload) {
  const res = await request(`/address/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteAddress(id) {
  return request(`/address/${id}`, { method: 'DELETE' });
}

export async function setDefault(id) {
  const res = await request(`/address/default/${id}`, { method: 'PATCH' });
  return res.data;
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
