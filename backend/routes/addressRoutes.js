const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  verifyAddress,
} = require('../controllers/addressController');

// All address routes require a logged-in user.
router.use(auth);

router.get('/', getAddresses);
router.post('/', createAddress);
router.post('/verify', verifyAddress);
router.get('/:id', getAddressById);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.patch('/default/:id', setDefaultAddress);

module.exports = router;
