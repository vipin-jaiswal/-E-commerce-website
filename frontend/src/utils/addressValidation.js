const PHONE_REGEX = /^[6-9]\d{9}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Validates the address form fields. Returns an errors object keyed
 * by field name; a field with no error is simply absent from the object.
 */
export function validateAddressForm(data) {
  const errors = {};

  if (!data.name?.trim()) errors.name = 'Name is required';
  else if (data.name.trim().length > 100) errors.name = 'Name is too long';

  if (!data.phone?.trim()) errors.phone = 'Phone number is required';
  else if (!PHONE_REGEX.test(data.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number';

  if (!data.address1?.trim()) errors.address1 = 'Address line 1 is required';
  else if (data.address1.trim().length > 200) errors.address1 = 'Address line 1 is too long';

  if (data.address2 && data.address2.trim().length > 200) errors.address2 = 'Address line 2 is too long';

  if (!data.city?.trim()) errors.city = 'City is required';
  if (!data.state?.trim()) errors.state = 'State is required';

  if (!data.pincode?.trim()) errors.pincode = 'Pincode is required';
  else if (!PINCODE_REGEX.test(data.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode';

  return errors;
}

export function isFormValid(data) {
  return Object.keys(validateAddressForm(data)).length === 0;
}

/** Strips every string field and collapses internal whitespace. */
export function sanitizeAddressData(data) {
  const clean = {};
  Object.entries(data).forEach(([key, value]) => {
    clean[key] = typeof value === 'string' ? value.trim() : value;
  });
  return clean;
}

export { PHONE_REGEX, PINCODE_REGEX };
