const User = require('../models/User');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user?.id).select('isAdmin');
    if (!user?.isAdmin) {
      return res.status(403).json({ message: 'Admin access is required' });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ message: 'Unable to verify admin access' });
  }
};
