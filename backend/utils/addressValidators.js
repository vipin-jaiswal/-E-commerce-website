const https = require('https');

const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const REQUIRED_FIELDS = ['name', 'phone', 'address1', 'city', 'state', 'pincode'];

/**
 * Validates the shape of an incoming address payload.
 * Returns { valid: boolean, errors: { field: message } }
 */
function validateAddressPayload(body) {
  const errors = {};

  REQUIRED_FIELDS.forEach((field) => {
    if (!body[field] || String(body[field]).trim() === '') {
      errors[field] = `${field} is required`;
    }
  });

  if (body.phone && !PHONE_REGEX.test(String(body.phone).trim())) {
    errors.phone = 'Enter a valid 10-digit Indian phone number';
  }

  if (body.pincode && !PINCODE_REGEX.test(String(body.pincode).trim())) {
    errors.pincode = 'Enter a valid 6-digit Indian pincode';
  }

  if (body.type && !['Home', 'Office', 'Other'].includes(body.type)) {
    errors.type = 'Address type must be Home, Office, or Other';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** Trims all string fields on the address payload before persisting. */
function sanitizeAddressPayload(body) {
  const sanitized = { ...body };
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
  });
  return sanitized;
}

/**
 * Server-side existence check against OpenStreetMap Nominatim.
 * This is a best-effort verification (Feature 4) — it does not
 * guarantee deliverability, only that the locality/pincode combination
 * resolves to a real place. Fails open (treated as unverified rather
 * than rejected) on network errors so a third-party outage never blocks
 * checkout entirely; the controller decides how to use `verified`.
 */
function verifyAddressExists({ address1, city, state, pincode, country = 'India' }) {
  return new Promise((resolve) => {
    const query = encodeURIComponent(`${address1}, ${city}, ${state}, ${pincode}, ${country}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1`;

    const req = https.get(
      url,
      { headers: { 'User-Agent': 'smart-address-system/1.0 (address verification)' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const results = JSON.parse(data);
            resolve({ verified: Array.isArray(results) && results.length > 0, results });
          } catch (e) {
            resolve({ verified: false, results: [], error: 'parse_error' });
          }
        });
      }
    );

    req.on('error', () => resolve({ verified: false, results: [], error: 'network_error' }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ verified: false, results: [], error: 'timeout' });
    });
  });
}

module.exports = {
  validateAddressPayload,
  sanitizeAddressPayload,
  verifyAddressExists,
  PHONE_REGEX,
  PINCODE_REGEX,
};
