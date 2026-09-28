const crypto = require('crypto');
const express = require('express');
const { fetchAdminOverview, fetchAdminCollection, fetchProducts } = require('../services/shopifyService');

const router = express.Router();
const TOKEN_TTL_SECONDS = 60 * 60 * 8;
const revokedTokens = new Set();
const ADMIN_COOKIE = 'dyva_admin_session';

const base64Url = (value) => Buffer.from(value).toString('base64url');
const createToken = (payload) => {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64Url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = crypto.createHmac('sha256', process.env.JWT_SECRET).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
};

const verifyToken = (token) => {
  if (!token || !process.env.JWT_SECRET || revokedTokens.has(token)) return null;
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;
  const unsigned = `${header}.${body}`;
  const expected = crypto.createHmac('sha256', process.env.JWT_SECRET).update(unsigned).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return payload.role === 'admin' && payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch {
    return null;
  }
};

const getToken = (request) => request.headers.authorization?.replace(/^Bearer\s+/i, '');
const getCookieToken = (request) => request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${ADMIN_COOKIE}=`))?.slice(ADMIN_COOKIE.length + 1);
const requireAdmin = (req, res, next) => {
  const token = getCookieToken(req) || getToken(req);
  const admin = verifyToken(token);
  if (!admin) return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  req.admin = admin;
  req.adminToken = token;
  return next();
};

router.post('/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const submittedEmail = String(email).trim().toLowerCase();
  console.info('[admin] login request received');
  console.info('[admin] checking email:', submittedEmail);
  if (!submittedEmail || !password) return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) return res.status(503).json({ success: false, message: 'Admin authentication is not configured.' });
  if (submittedEmail !== process.env.ADMIN_EMAIL.trim().toLowerCase() || password !== process.env.ADMIN_PASSWORD) {
    console.info('[admin] authentication failed');
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
  const token = createToken({ role: 'admin', email: process.env.ADMIN_EMAIL.trim().toLowerCase(), jti: crypto.randomUUID(), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS });
  res.cookie(ADMIN_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: TOKEN_TTL_SECONDS * 1000, path: '/' });
  console.info('[admin] authentication successful');
  return res.status(200).json({ success: true, message: 'Admin login successful', admin: { email: process.env.ADMIN_EMAIL.trim().toLowerCase(), role: 'admin' }, token });
});

router.post('/logout', (req, res) => {
  const token = getCookieToken(req) || getToken(req);
  if (token) revokedTokens.add(token);
  res.clearCookie(ADMIN_COOKIE, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
  return res.json({ success: true, message: 'Admin logged out.' });
});

router.use(requireAdmin);
router.get('/me', (req, res) => res.json({ success: true, authenticated: true, admin: { email: req.admin.email, role: req.admin.role } }));
router.get('/session', (req, res) => res.json({ success: true, data: { role: req.admin.role, expiresAt: req.admin.exp } }));
router.get('/overview', async (req, res) => {
  try {
    return res.json({ success: true, data: await fetchAdminOverview() });
  } catch (error) {
    console.error('[admin] Shopify overview failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to load Shopify admin data.' });
  }
});

router.get('/products', async (req, res) => {
  try {
    return res.json({ success: true, data: await fetchProducts({ first: 100 }) });
  } catch (error) {
    console.error('[admin] Shopify products failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to load Shopify products.' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const data = await fetchAdminCollectionData('orders');
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[admin] Shopify orders failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to load Shopify orders.' });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const data = await fetchAdminCollectionData('customers');
    return res.json({ success: true, data });
  } catch (error) {
    console.error('[admin] Shopify customers failed:', error.message);
    return res.status(502).json({ success: false, message: 'Unable to load Shopify customers.' });
  }
});

const fetchAdminCollectionData = (type) => fetchAdminCollection(type);

module.exports = { router, requireAdmin, requireAdminAuth: requireAdmin };
