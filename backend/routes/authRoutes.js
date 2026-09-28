const express = require('express');
const { loginCustomer, registerCustomer, fetchCustomer, updateCustomer, recoverCustomer, resetCustomerByUrl } = require('../services/shopifyService');

const router = express.Router();

const getUserErrorMessages = (errors = []) =>
  errors.map((error) => error.message).filter(Boolean);

const handleShopifyError = (res, error, message) => {
  console.error(`[auth] ${message}:`, error);
  const isConfigurationError = error.message?.includes('SHOPIFY_STOREFRONT_TOKEN');
  const isPermissionError = error.message?.includes('Access denied');
  return res.status(isConfigurationError ? 503 : isPermissionError ? 403 : 502).json({
    success: false,
    message: isConfigurationError
      ? 'Shopify customer authentication is not configured. Add SHOPIFY_STOREFRONT_TOKEN to backend/.env.'
      : isPermissionError
        ? 'Shopify customer registration is missing the unauthenticated_write_customers scope.'
      : message,
    errors: [error.message].filter(Boolean),
  });
};

const getCustomerToken = (request) => request.headers.authorization?.replace(/^Bearer\s+/i, '');
const recoveryAttempts = new Map();

const canAttemptRecovery = (key) => {
  const now = Date.now();
  const previous = recoveryAttempts.get(key) || 0;
  if (now - previous < 60_000) return false;
  recoveryAttempts.set(key, now);
  return true;
};

router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  };
  if (!email || !canAttemptRecovery(`${req.ip}:${email}`)) return res.json(genericResponse);
  try {
    await recoverCustomer(email);
    return res.json(genericResponse);
  } catch (error) {
    if (error.message?.includes('SHOPIFY_STOREFRONT_TOKEN')) return handleShopifyError(res, error, 'Password recovery is not configured');
    return res.json(genericResponse);
  }
});

router.post('/reset-password', async (req, res) => {
  const resetUrl = String(req.body?.resetUrl || '').trim();
  const password = String(req.body?.password || '');
  if (!resetUrl || password.length < 8) return res.status(400).json({ success: false, message: 'A valid reset link and password of at least 8 characters are required.' });
  try {
    const result = await resetCustomerByUrl({ resetUrl, password });
    const errors = getUserErrorMessages(result.customerUserErrors);
    if (errors.length || !result.customerAccessToken) return res.status(400).json({ success: false, message: errors[0] || 'This reset link is invalid or has expired.' });
    return res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    return handleShopifyError(res, error, 'Unable to reset password');
  }
});

router.get('/me', async (req, res) => {
  const token = getCustomerToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  try {
    const customer = await fetchCustomer(token);
    if (!customer) return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
    return res.json({ success: true, data: { customer } });
  } catch (error) {
    return handleShopifyError(res, error, 'Unable to load your account');
  }
});

router.patch('/profile', async (req, res) => {
  const token = getCustomerToken(req);
  const { name = '', phone = '' } = req.body || {};
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in.' });
  if (!parts.length) return res.status(400).json({ success: false, message: 'Full name is required.' });
  try {
    const customer = await updateCustomer(token, { firstName: parts[0], lastName: parts.slice(1).join(' '), phone: String(phone).trim() || null });
    return res.json({ success: true, data: { customer } });
  } catch (error) {
    return handleShopifyError(res, error, 'Unable to update your profile');
  }
});

router.post('/register', async (req, res) => {
  const { name = '', email = '', password = '' } = req.body || {};
  const trimmedName = String(name).trim();
  const trimmedEmail = String(email).trim().toLowerCase();

  if (!trimmedName || !trimmedEmail || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Name, a valid email, and a password of at least 8 characters are required.',
      errors: [],
    });
  }

  const [firstName, ...lastNameParts] = trimmedName.split(/\s+/);
  try {
    const result = await registerCustomer({
      firstName,
      lastName: lastNameParts.join(' '),
      email: trimmedEmail,
      password,
    });
    const errors = getUserErrorMessages(result.customerUserErrors);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }
    return res.status(201).json({ success: true, data: { customer: result.customer } });
  } catch (error) {
    return handleShopifyError(res, error, 'Shopify customer registration failed');
  }
});

router.post('/login', async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const trimmedEmail = String(email).trim().toLowerCase();

  if (!trimmedEmail || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required.',
      errors: [],
    });
  }

  try {
    const result = await loginCustomer({ email: trimmedEmail, password });
    const errors = getUserErrorMessages(result.customerUserErrors);
    if (errors.length || !result.customerAccessToken) {
      return res.status(401).json({
        success: false,
        message: errors[0] || 'Invalid email or password.',
        errors,
      });
    }
    return res.json({
      success: true,
      token: result.customerAccessToken.accessToken,
      expiresAt: result.customerAccessToken.expiresAt,
    });
  } catch (error) {
    return handleShopifyError(res, error, 'Shopify customer login failed');
  }
});

module.exports = router;