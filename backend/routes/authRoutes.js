const express = require('express');
const { registerCustomer, findCustomerByEmail, fetchCustomer, updateCustomer } = require('../services/shopifyService');
const { sendEmailOtp } = require('../services/msg91EmailService');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const LoginHistory = require('../models/LoginHistory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const getUserErrorMessages = (errors = []) =>
  errors.map((error) => error.message).filter(Boolean);

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

const safeCustomer = (customer, extra = {}) => ({
  id: customer._id.toString(),
  name: customer.name,
  email: customer.email,
  phone: customer.phone || null,
  shopifyCustomerId: customer.shopifyCustomerId || null,
  emailVerified: Boolean(customer.emailVerified),
  lastLoginAt: customer.lastLoginAt || null,
  ...extra,
});

router.post('/register/send-otp', async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const existing = pendingRegistrations.get(email);
  const phone = normalizePhone(req.body?.phone) || existing?.phone || null;
  if (!name || !EMAIL_REGEX.test(email) || !phone || (!existing && password.length < 8)) {
    return res.status(400).json({ success: false, message: 'Name, a valid email, phone number, and a password of at least 8 characters are required.' });
  }
  if (!existing) {
    try {
      if (await Customer.exists({ email })) {
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
    pendingRegistrations.set(email, { name, phone, otpHash, expiresAt: now + OTP_TTL_MS, attempts: 0 });
    console.log("[auth] Registration OTP state stored for:", email);
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
  console.log("[auth] Registration OTP state found:", Boolean(registration));
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

const completeRegistration = async (req, res, { requireOtp = false } = {}) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  const password = String(req.body?.password || '');
  if (!EMAIL_REGEX.test(email) || password.length < 8 || (requireOtp && !/^\d{6}$/.test(otp))) {
    return res.status(400).json({ success: false, message: 'A valid email, verified email address, and password of at least 8 characters are required.' });
  }
  const registration = pendingRegistrations.get(email);
  console.log("[auth] Registration OTP state found:", Boolean(registration));
  if (!registration) return res.status(400).json({ success: false, message: 'Request a verification code to continue.' });
  if (Date.now() > registration.expiresAt) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: 'Verification code expired. Request a new one.' });
  }
  if (requireOtp) {
    const suppliedHash = crypto.createHash('sha256').update(`${email}:${otp}`).digest();
    const storedHash = Buffer.from(registration.otpHash, 'hex');
    if (!crypto.timingSafeEqual(suppliedHash, storedHash)) {
      registration.attempts += 1;
      if (registration.attempts >= OTP_MAX_ATTEMPTS) pendingRegistrations.delete(email);
      return res.status(400).json({ success: false, message: registration.attempts >= OTP_MAX_ATTEMPTS ? 'Too many incorrect codes. Request a new code.' : 'Invalid verification code.' });
    }
  } else if (!registration.verifiedAt) {
    return res.status(400).json({ success: false, message: 'Verify your email before creating your account.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ success: false, message: 'Authentication is not configured right now.' });
  }

  const [firstName, ...lastNameParts] = registration.name.split(/\s+/);
  try {
    const existingLocalCustomer = await Customer.findOne({ email });
    if (existingLocalCustomer) {
      pendingRegistrations.delete(email);
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
    }
    let shopifyCustomer = await findCustomerByEmail(email);
    if (!shopifyCustomer) {
      const result = await registerCustomer({ firstName, lastName: lastNameParts.join(' '), email, phone: registration.phone });
      const createErrors = getUserErrorMessages(result.customerUserErrors);
      if (createErrors.length || !result.customer) {
        return res.status(400).json({ success: false, message: createErrors[0] || 'Unable to create your account.' });
      }
      shopifyCustomer = result.customer;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const customer = await Customer.create({
      name: registration.name,
      email,
      phone: registration.phone,
      password: passwordHash,
      shopifyCustomerId: shopifyCustomer.id,
      emailVerified: true,
    });
    const token = jwt.sign(
      { customerId: customer._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    pendingRegistrations.delete(email);
    return res.status(201).json({
      success: true,
      token,
      data: { customer: safeCustomer(customer) },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
    console.error('[auth] Registration failed:', error.message);
    return res.status(503).json({ success: false, message: 'Unable to complete registration right now. Please try again.' });
  }
};

router.post('/register/complete', (req, res) => completeRegistration(req, res));
router.post('/register/verify-otp', (req, res) => completeRegistration(req, res, { requireOtp: true }));

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
    if (!await Customer.exists({ email })) {
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
    console.error('[auth] Forgot password OTP failed:', error.message);
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
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');
  const challenge = recoveryChallenges.get(email);
  if (!challenge?.verifiedAt || Date.now() > challenge.expiresAt) {
    recoveryChallenges.delete(email);
    return res.status(400).json({ success: false, message: 'Verification expired. Please start again.' });
  }
  if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'A password of at least 8 characters is required.' });
  if (newPassword !== confirmPassword) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      recoveryChallenges.delete(email);
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }
    customer.password = await bcrypt.hash(newPassword, 12);
    await customer.save();
    recoveryChallenges.delete(email);
    recoveryAttempts.delete(`${req.ip || 'ip'}:${email}`);
    return res.json({ success: true, message: 'Your password has been reset successfully.' });
  } catch (error) {
    console.error('[auth] Password reset failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to reset your password right now. Please try again.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const [firstName = '', ...lastNameParts] = String(req.user.name || '').trim().split(/\s+/);
  let shopifyProfile = null;
  if (req.user.shopifyCustomerId) {
    try {
      shopifyProfile = await fetchCustomer(req.user.shopifyCustomerId);
    } catch (error) {
      console.warn('[auth] Shopify profile details unavailable:', error.message);
    }
  }
  const extra = {
    firstName: shopifyProfile?.firstName || firstName,
    lastName: shopifyProfile?.lastName || lastNameParts.join(' '),
    addresses: shopifyProfile?.addresses || { nodes: [] },
    defaultAddress: shopifyProfile?.defaultAddress || null,
    orders: shopifyProfile?.orders || { nodes: [] },
  };
  return res.json({ success: true, data: { customer: safeCustomer(req.user, extra) } });
});

router.patch('/profile', authMiddleware, async (req, res) => {
  const { name = '', phone = '' } = req.body || {};
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return res.status(400).json({ success: false, message: 'Full name is required.' });
  const normalizedPhone = normalizePhone(phone);
  if (String(phone).trim() && !normalizedPhone) return res.status(400).json({ success: false, message: 'A valid phone number is required.' });
  try {
    let shopifyCustomer = null;
    if (req.user.shopifyCustomerId) {
      shopifyCustomer = await updateCustomer(req.user.shopifyCustomerId, {
        firstName: parts[0], lastName: parts.slice(1).join(' '), phone: normalizedPhone,
      });
    }
    req.user.name = parts.join(' ');
    req.user.phone = normalizedPhone;
    await req.user.save();
    return res.json({ success: true, data: { customer: safeCustomer(req.user, {
      firstName: shopifyCustomer?.firstName || parts[0],
      lastName: shopifyCustomer?.lastName || parts.slice(1).join(' '),
    }) } });
  } catch (error) {
    console.error('[auth] Profile update failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to update your profile right now. Please try again.' });
  }
});

router.post('/register', async (req, res) => {
  return completeRegistration(req, res, { requireOtp: true });
});

router.post('/login', async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPassword = String(password);
  if (!EMAIL_REGEX.test(normalizedEmail) || !normalizedPassword) {
    return res.status(400).json({ success: false, message: 'A valid email and password are required.' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(503).json({ success: false, message: 'Authentication is not configured right now.' });
  }

  try {
    const customer = await Customer.findOne({ email: normalizedEmail }).select('+password');
    if (!customer || !await bcrypt.compare(normalizedPassword, customer.password)) {
      if (customer) {
        await LoginHistory.create({ customerId: customer._id, ipAddress: req.ip, userAgent: req.get('user-agent'), success: false });
      }
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' });
    }

    customer.lastLoginAt = new Date();
    await customer.save();
    await LoginHistory.create({ customerId: customer._id, ipAddress: req.ip, userAgent: req.get('user-agent'), success: true });
    const token = jwt.sign({ customerId: customer._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({
      success: true,
      token,
      data: { customer: safeCustomer(customer) },
      account: { email: normalizedEmail },
    });
  } catch (error) {
    console.error('[auth] MongoDB login failed:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to sign in right now. Please try again.' });
  }
});

module.exports = router;
