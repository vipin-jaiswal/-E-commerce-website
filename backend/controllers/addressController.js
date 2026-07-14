const Address = require('../models/Address');
const {
  validateAddressPayload,
  sanitizeAddressPayload,
  verifyAddressExists,
} = require('../utils/addressValidators');

// GET /api/address
// List every saved address for the logged-in user, default first.
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id }).sort({
      isDefault: -1,
      updatedAt: -1,
    });
   res.status(200).json(addresses);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch addresses', error: err.message });
  }
};

// GET /api/address/:id
exports.getAddressById = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    res.status(200).json(address);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch address', error: err.message });
  }
};

// POST /api/address
exports.createAddress = async (req, res) => {
  try {
    const payload = sanitizeAddressPayload(req.body);
    const { valid, errors } = validateAddressPayload(payload);

    if (!valid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // If coordinates weren't supplied (fully manual entry), attempt a
    // best-effort verification against OpenStreetMap. We never hard-block
    // saving on a network failure — verified just stays false.
    let isVerified = Boolean(payload.latitude && payload.longitude);
    if (!isVerified) {
      const { verified } = await verifyAddressExists(payload);
      isVerified = verified;
    }

    const existingCount = await Address.countDocuments({ user: req.user.id });

    const address = await Address.create({
      ...payload,
      user: req.user.id,
      isDefault: existingCount === 0 ? true : Boolean(payload.isDefault),
      isVerified,
    });

    res.status(201).json(address);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed', error: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create address', error: err.message });
  }
};

// PUT /api/address/:id
exports.updateAddress = async (req, res) => {
  try {
    const payload = sanitizeAddressPayload(req.body);
    const { valid, errors } = validateAddressPayload(payload);

    if (!valid) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // An edited address must be verified again; do not keep a stale
    // verification result from the previous address details.
    let isVerified = Boolean(payload.latitude && payload.longitude);
    if (!isVerified) {
      const result = await verifyAddressExists(payload);
      isVerified = result.verified;
    }

    Object.assign(address, { ...payload, isVerified });
    await address.save(); // pre-save hook re-enforces single default

    res.status(200).json(address);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Validation failed', error: err.message });
    }
    res.status(500).json({ success: false, message: 'Failed to update address', error: err.message });
  }
};

// DELETE /api/address/:id
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If the deleted address was the default, promote the most
    // recently updated remaining address to default automatically.
    if (address.isDefault) {
      const next = await Address.findOne({ user: req.user.id }).sort({ updatedAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete address', error: err.message });
  }
};

// PATCH /api/address/default/:id
exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    address.isDefault = true;
    await address.save(); // pre-save hook unsets isDefault on all others

    res.status(200).json(address);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set default address', error: err.message });
  }
};

// POST /api/address/verify
// Used by the frontend (Feature 4) to check a manually-typed address
// before it's saved, without creating a record yet.
exports.verifyAddress = async (req, res) => {
  try {
    const { address1, city, state, pincode, country } = req.body;
    if (!address1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'address1, city, state and pincode are required' });
    }

    const { verified, results } = await verifyAddressExists({ address1, city, state, pincode, country });
    res.status(200).json({ success: true, verified, match: results?.[0] || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification failed', error: err.message });
  }
};
