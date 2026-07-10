const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_ACCOUNT = {
  name: 'Admin',
  email: 'admin@dyva123.com',
  password: 'admin@123',
};

async function seedAdminUser() {
  const passwordHash = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);

  await User.findOneAndUpdate(
    { email: ADMIN_ACCOUNT.email },
    {
      $set: {
        name: ADMIN_ACCOUNT.name,
        email: ADMIN_ACCOUNT.email,
        isAdmin: true,
        passwordHash,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );
}

module.exports = seedAdminUser;