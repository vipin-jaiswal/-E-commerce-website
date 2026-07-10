const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT sent in the Authorization header (Bearer token)
 * and attaches the decoded payload to req.user.
 *
 * Adjust `decoded.id` below if your existing auth flow signs the
 * token with a different field name (e.g. decoded._id, decoded.userId).
 */
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id || decoded._id || decoded.userId };

    if (!req.user.id) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};
