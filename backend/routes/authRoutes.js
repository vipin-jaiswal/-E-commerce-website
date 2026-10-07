const express = require('express');
const { loginCustomer, registerCustomer, findCustomerByEmail, fetchCustomer, updateCustomer } = require('../services/shopifyService');
const { sendEmailOtp } = require('../services/msg91EmailService');
const crypto = require('crypto');

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pendingRegistrations = new Map();
const recoveryChallenges = new Map();
const otpRequestTimes = new Map();
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const normalizePhone = (phone) => {
  const value = String(phone || '').trim().replace(/[\s()-]/g, '');
  if (!value) return null;
  if (/^\+[1-9]\d{7,14}$/.test(value)) return value;
  if (/^91[6-9]\d{9}$/.test(value)) return `+${value}`;
  if (/^0?[6-9]\d{9}$/.test(value)) return `+91${value.replace(/^0/, '')}`;
  return null;
};

router.post('/register/send-otp', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const existing = pendingRegistrations.get(email);
  if (!name || !EMAIL_REGEX.test(email) || (!existing && password.length < 8)) {
    return res.status(400).json({ success: false, message: 'Name, a valid email, and a password of at least 8 characters are required.' });
  }
  if (!existing) {
    try {
      if (await findCustomerByEmail(email)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
      }
    } catch (error) {
      console.error('[auth] Unable to check registration email:', error.message);
      return res.status(503).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
  }
  const now = Date.now();
  const previous = otpRequestTimes.get(`${req.ip || 'ip'}:${email}`) || 0;
  if (now - previous < OTP_RESEND_MS) return res.status(429).json({ success: false, message: 'Please wait before requesting another verification code.' });
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  try {
    await sendEmailOtp({ email, otp });
    const otpHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
    pendingRegistrations.set(email, { name, otpHash, expiresAt: now + OTP_TTL_MS, attempts: 0 });
    otpRequestTimes.set(`${req.ip || 'ip'}:${email}`, now);
    return res.json({ success: true, message: 'Verification code sent. It expires in 10 minutes.' });
  } catch (error) {
    console.error('[auth] MSG91 email OTP send failed:', error.message);
    return res.status(503).json({ success: false, message: 'Unable to send a verification code right now. Please try again later.' });
  }
});

router.post('/register/resend-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const registration = pendingRegistrations.get(email);
  if (!registration || Date.now() > registration.expiresAt) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: 'Please submit your registration details again to request a new code.' });
  }
  req.body = { ...req.body, name: registration.name };
  req.url = '/register/send-otp';
  return router.handle(req, res);
});

router.post('/register/verify-code', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  const registration = pendingRegistrations.get(email);
  if (!registration) return res.status(400).json({ success: false, message: 'Request a verification code to continue.' });
  if (Date.now() > registration.expiresAt) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
  }
  registration.attempts += 1;
  const suppliedHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest();
  const storedHash = Buffer.from(registration.otpHash, 'hex');
  if (!/^\d{6}$/.test(otp) || !crypto.timingSafeEqual(suppliedHash, storedHash)) {
    if (registration.attempts >= OTP_MAX_ATTEMPTS) pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: registration.attempts >= OTP_MAX_ATTEMPTS ? 'Too many incorrect codes. Request a new code.' : 'Invalid verification code.' });
  }
  registration.verifiedAt = Date.now();
  return res.json({ success: true, verified: true, message: 'Email verified.' });
});

router.post('/register/complete', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const phone = null;
  const registration = pendingRegistrations.get(email);
  if (!registration || !registration.verifiedAt || Date.now() > registration.expiresAt) {
    return res.status(400).json({ success: false, message: 'Verify your email before creating your account.' });
  }
  if (password.length < 8) return res.status(400).json({ success: false, message: 'A password of at least 8 characters is required.' });
  const [firstName, ...lastNameParts] = registration.name.split(/\s+/);
  try {
    const created = await registerCustomer({ firstName, lastName: lastNameParts.join(' '), email, password, phone });
    const createErrors = getUserErrorMessages(created.customerUserErrors);
    if (createErrors.length || !created.customer) return res.status(400).json({ success: false, message: createErrors[0] || 'Unable to create your account.', errors: createErrors });
    const login = await loginCustomer({ email, password });
    const loginErrors = getUserErrorMessages(login.customerUserErrors);
    if (loginErrors.length || !login.customerAccessToken) return res.status(502).json({ success: false, message: 'Account created, but automatic sign-in failed. Please sign in.' });
    pendingRegistrations.delete(email);
    return res.status(201).json({ success: true, token: login.customerAccessToken.accessToken, expiresAt: login.customerAccessToken.expiresAt, data: { customer: created.customer } });
  } catch (error) {
    return handleShopifyError(res, error, 'Shopify customer registration failed');
  }
});

router.post('/register/verify-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  const password = String(req.body?.password || '');
  const phone = null;
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Your password is required to finish creating the account.' });
  const registration = pendingRegistrations.get(email);
  if (!registration) return res.status(400).json({ success: false, message: 'Request a verification code to continue.' });
  if (Date.now() > registration.expiresAt) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
  }
  registration.attempts += 1;
  const suppliedHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest();
  const storedHash = Buffer.from(registration.otpHash, 'hex');
  if (!/^\d{6}$/.test(otp) || !crypto.timingSafeEqual(suppliedHash, storedHash)) {
    if (registration.attempts >= OTP_MAX_ATTEMPTS) pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: registration.attempts >= OTP_MAX_ATTEMPTS ? 'Too many incorrect codes. Request a new code.' : 'Invalid verification code.' });
  }

  const [firstName, ...lastNameParts] = registration.name.split(/\s+/);
  try {
    if (await findCustomerByEmail(email)) {
      pendingRegistrations.delete(email);
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
    }
    const created = await registerCustomer({ firstName, lastName: lastNameParts.join(' '), email, password, phone });
    const createErrors = getUserErrorMessages(created.customerUserErrors);
    if (createErrors.length || !created.customer) return res.status(400).json({ success: false, message: createErrors[0] || 'Unable to create your account.', errors: createErrors });
    const login = await loginCustomer({ email, password });
    const loginErrors = getUserErrorMessages(login.customerUserErrors);
    if (loginErrors.length || !login.customerAccessToken) return res.status(502).json({ success: false, message: 'Account created, but automatic sign-in failed. Please sign in.' });
    pendingRegistrations.delete(email);
    return res.status(201).json({ success: true, token: login.customerAccessToken.accessToken, expiresAt: login.customerAccessToken.expiresAt, data: { customer: created.customer } });
  } catch (error) {
    return handleShopifyError(res, error, 'Shopify customer registration failed');
  }
});

router.post('/forgot-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  const rateLimitKey = `${req.ip || 'ip'}:${email}`;
  if (!canAttemptRecovery(rateLimitKey)) {
    return res.status(429).json({
      success: false,
      message: 'A verification code was recently requested. Please wait at least a minute before trying again.',
    });
  }

  try {
    if (!await findCustomerByEmail(email)) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }
    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    await sendEmailOtp({ email, otp });
    recoveryChallenges.set(email, {
      otpHash: crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex'),
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });
    return res.json({ success: true, otpRequired: true, message: 'Verification code sent. It expires in 10 minutes.' });
  } catch (error) {
    console.error(`[auth] Forgot password OTP failed for ${email}:`, error.message);
    return res.status(503).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

router.post('/forgot-password/verify-otp', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  const challenge = recoveryChallenges.get(email);
  if (!challenge || Date.now() > challenge.expiresAt) {
    recoveryChallenges.delete(email);
    return res.status(400).json({ success: false, message: 'Verification code expired or unavailable. Please start again.' });
  }
  challenge.attempts += 1;
  const valid = /^\d{6}$/.test(otp) && crypto.timingSafeEqual(
    crypto.createHash('sha256').update(`${email}:${otp}`).digest(),
    Buffer.from(challenge.otpHash, 'hex')
  );
  if (!valid) {
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) recoveryChallenges.delete(email);
    return res.status(400).json({ success: false, message: 'Invalid verification code.' });
  }
  challenge.verifiedAt = Date.now();
  return res.json({ success: true, otpVerified: true, message: 'Verification successful. You can now choose a new password.' });
});

router.post('/forgot-password/update-password', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
  const challenge = recoveryChallenges.get(email);
  if (!challenge?.verifiedAt || Date.now() > challenge.expiresAt) {
    recoveryChallenges.delete(email);
    return res.status(400).json({ success: false, message: 'Verification expired. Please start again.' });
  }
  return res.status(501).json({
    success: false,
    message: 'Direct password updates are not available for Shopify legacy customer accounts.',
  });
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
  return res.status(410).json({ success: false, message: 'Email verification is required. Request a verification code first.' });
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
    if (result.customerUserErrors?.length || !result.customerAccessToken) {
      const shopifyErrorCode = result.customerUserErrors?.[0]?.code;
      // Shopify can return an error code without a useful message. Keep the
      // failure explicit for clients while avoiding logging credentials.
      console.warn('[auth] Shopify rejected customer sign-in:', JSON.stringify(
        (result.customerUserErrors || []).map(({ code, field }) => ({ code, field }))
      ));
      return res.status(401).json({
        success: false,
        code: shopifyErrorCode || 'INVALID_CREDENTIALS',
        message: shopifyErrorCode === 'UNIDENTIFIED_CUSTOMER'
          ? 'No account found with this email.'
          : 'Incorrect email or password.',
      });
    }
    return res.json({
      success: true,
      token: result.customerAccessToken.accessToken,
      expiresAt: result.customerAccessToken.expiresAt,
      account: { email: trimmedEmail },
    });
  } catch (error) {
    return handleShopifyError(res, error, 'Shopify customer login failed');
  }
});

module.exports = router;
