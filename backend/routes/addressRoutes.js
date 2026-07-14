const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  verifyAddress,
} = require('../controllers/addressController');

router.route('/').get(protect, getAddresses).post(protect, createAddress);
router.route('/:id').put(protect, updateAddress).delete(protect, deleteAddress);
router.patch('/default/:id', protect, setDefaultAddress);
router.post('/verify', protect, verifyAddress);

module.exports = router;
