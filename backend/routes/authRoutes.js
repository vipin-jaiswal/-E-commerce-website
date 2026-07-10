const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();
const emailOtpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (value = '') => String(value).trim().toLowerCase();

const normalizePhone = (value = '') => {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (value.trim().startsWith('+')) return `+${digits}`;
  return digits.length > 10 ? `+${digits}` : `+91${digits.slice(-10)}`;
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const getMailer = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user,
      pass,
    },
  });
};

const mailer = getMailer();

const sendEmailOtpMessage = async ({ email, otp, name }) => {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@dyva.local';
  const subject = 'Your DYVA email verification code';
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const text = `${greeting}\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.`;

  if (mailer) {
    await mailer.sendMail({
      from,
      to: email,
      subject,
      text,
    });
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[auth] Email OTP for ${email}: ${otp}`);
    return;
  }

  throw new Error('Email service is not configured');
};

const createOtpRecord = ({ email, otp, name }) => {
  emailOtpStore.set(email, {
    otp,
    name: String(name || '').trim(),
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
  });
};

const getOtpRecord = (email) => emailOtpStore.get(email);

const clearOtpRecord = (email) => {
  emailOtpStore.delete(email);
};

const createToken = (user) => {
  if (!process.env.JWT_SECRET) return null;
  return jwt.sign(
    { id: user._id.toString(), phone: user.phone || '', isAdmin: !!user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email || '',
  phone: user.phone || '',
  firebaseUid: user.firebaseUid || '',
  isAdmin: !!user.isAdmin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getAdminByEmail = async (email) => {
  if (!email) return null;
  return User.findOne({ email, isAdmin: true }).select('+passwordHash');
};

const signInAdmin = async ({ email, password }) => {
  const adminUser = await User.findOne({ email, isAdmin: true }).select('+passwordHash');

  if (!adminUser || !adminUser.passwordHash) {
    const error = new Error('Invalid admin credentials');
    error.statusCode = 401;
    throw error;
  }

  const matches = await bcrypt.compare(String(password || ''), adminUser.passwordHash);
  if (!matches) {
    const error = new Error('Invalid admin credentials');
    error.statusCode = 401;
    throw error;
  }

  return adminUser;
};

const upsertUser = async (payload = {}) => {
  const name = String(payload.name || payload.displayName || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const phone = payload.phone || payload.phoneNumber || '';
  const firebaseUid = String(payload.firebaseUid || payload.uid || '').trim();
  const isAdmin = Boolean(payload.isAdmin);
  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const normalizedUid = String(firebaseUid || '').trim();
  const normalizedEmail = email;
  const normalizedName = name || normalizedPhone || normalizedUid || normalizedEmail;

  if (!normalizedPhone && !normalizedUid && !normalizedEmail) {
    const error = new Error('phone, firebaseUid or email is required');
    error.statusCode = 400;
    throw error;
  }

  const lookup = [];
  if (normalizedPhone) lookup.push({ phone: normalizedPhone });
  if (normalizedUid) lookup.push({ firebaseUid: normalizedUid });
  if (normalizedEmail) lookup.push({ email: normalizedEmail });

  const existingUser = await User.findOne(lookup.length > 0 ? { $or: lookup } : { phone: normalizedPhone });
  const fallbackName = normalizedPhone || normalizedUid || normalizedEmail || 'User';
  const nextName = normalizedName || existingUser?.name || fallbackName;

  const update = {
    $set: {
      name: nextName,
    },
    $setOnInsert: {
      isAdmin,
    },
  };

  if (normalizedEmail) update.$set.email = normalizedEmail;
  if (normalizedPhone) update.$set.phone = normalizedPhone;
  if (normalizedUid) update.$set.firebaseUid = normalizedUid;

  const user = await User.findOneAndUpdate(
    lookup.length > 0 ? { $or: lookup } : { phone: normalizedPhone },
    update,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return user;
};

router.post('/register', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const adminUser = await getAdminByEmail(email);
    if (adminUser) {
      return res.status(403).json({ message: 'This email is reserved for admin login' });
    }

    const user = await upsertUser(req.body || {});
    const token = createToken(user);

    return res.status(201).json({
      message: 'Account created successfully',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Unable to register user' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const payload = req.body || {};
    const email = normalizeEmail(payload.email);
    const password = String(payload.password || '').trim();

    if (password) {
      const user = await signInAdmin({ email, password });
      const token = createToken(user);

      return res.json({
        message: 'Login successful',
        user: sanitizeUser(user),
        token,
      });
    }

    const adminUser = await getAdminByEmail(email);
    if (adminUser) {
      return res.status(403).json({ message: 'Admin must sign in with password' });
    }

    const user = await upsertUser(payload);
    const token = createToken(user);

    return res.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || 'Unable to login user' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

module.exports = router;

router.post('/email/send-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const name = String(req.body?.name || '').trim();

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const otp = generateOtp();
    createOtpRecord({ email, otp, name });
    await sendEmailOtpMessage({ email, otp, name });

    return res.json({
      message: 'Verification code sent to your email',
      ...(process.env.NODE_ENV !== 'production' && !mailer ? { devOtp: otp } : {}),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to send email OTP' });
  }
});

router.post('/email/verify-otp', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || '').trim();
    const name = String(req.body?.name || '').trim();

    if (!email || !otp) {
      return res.status(400).json({ message: 'email and otp are required' });
    }

    const record = getOtpRecord(email);
    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not requested' });
    }

    if (record.expiresAt < Date.now()) {
      clearOtpRecord(email);
      return res.status(400).json({ message: 'OTP expired or not requested' });
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      clearOtpRecord(email);
      return res.status(429).json({ message: 'Too many invalid attempts' });
    }

    if (record.otp !== otp) {
      record.attempts += 1;
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    clearOtpRecord(email);
    const user = await upsertUser({
      name: name || record.name || email.split('@')[0],
      email,
    });
    const token = createToken(user);

    return res.json({
      message: 'Email verified successfully',
      user: sanitizeUser(user),
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to verify email OTP' });
  }
});