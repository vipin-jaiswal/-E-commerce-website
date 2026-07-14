import React, { useState } from 'react';
import { Home, Building2, MapPinned, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationButton from './LocationButton';
import AddressSearch from './AddressSearch';
import { validateAddressForm, sanitizeAddressData } from '../../utils/addressValidation';
import { lookupPincode } from '../../utils/geocoding';
import { verifyAddress } from '../../services/addressService';

const TYPES = [
  { id: 'Home', label: 'Home', icon: Home },
  { id: 'Office', label: 'Office', icon: Building2 },
  { id: 'Other', label: 'Other', icon: MapPinned },
];

function Field({ label, name, value, onChange, error, autoComplete, type = 'text', className = '', maxLength }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={label}
        className={`w-full rounded-xl border p-4 outline-none transition ${
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-100'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/**
 * Reusable address form. Used standalone inside AddressModal for both
 * "Add New Address" and "Edit Address" flows (Feature 6/7), and can also
 * be dropped directly into a page.
 *
 * Props:
 *  - data, onChange: controlled form state (object, setter)
 *  - onSubmit(sanitizedData): called once the form passes validation
 *    (and, for fully manual entries, passes the verify-address check)
 *  - submitting: disables the submit button while a save is in flight
 *  - submitLabel: text for the submit button
 *  - onLocationPicked: callback to merge location data from a picker
 */
export default function AddressForm({
  data,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = 'Save Address',
  onLocationPicked,
}) {
  const [errors, setErrors] = useState({});
  const [verifying, setVerifying] = useState(false);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    let next = value;

    if (name === 'phone') next = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'pincode') {
      next = value.replace(/\D/g, '').slice(0, 6);
    }

    const updatedData = { ...data, [name]: next };
    onChange(updatedData);

    if (name === 'pincode' && next.length === 6) {
      const resolved = await lookupPincode(next);
      if (resolved) {
        onChange((current) => ({
          ...current,
          city: resolved.city || current.city,
          state: resolved.state || current.state,
          area: current.area || resolved.area,
        }));
      }
    }
  };

  const applyLocation = (resolved) => {
    // If the form is inside a modal that handles location picking, use its logic.
    // Otherwise, update the state directly.
    onLocationPicked ? onLocationPicked(resolved) : onChange((prev) => ({ ...prev, ...resolved }));
  };

  const applySearchResult = (resolved) => {
    const merged = { ...data, ...resolved };
    onLocationPicked ? onLocationPicked(merged) : onChange(merged);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateAddressForm(data);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }

    const sanitized = sanitizeAddressData(data);

    // For manually entered addresses, try to verify them first.
    if (!sanitized.latitude && !sanitized.longitude) {
      setVerifying(true);
      try {
        const { verified } = await verifyAddress(sanitized);
        if (!verified) {
          toast.error('We couldn\'t verify this address. Please check for typos or use the search/location features.');
          setVerifying(false);
          return;
        }
      } catch (err) {
        // If the verification service fails, don't block submission.
        // The user can still save the address as unverified.
        console.error("Address verification failed:", err);
        // We will proceed to save it as unverified.
      } finally {
        setVerifying(false);
      }
    }

    onSubmit(sanitized);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange({ ...data, type: id })}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 text-xs font-semibold transition ${
              data.type === id ? 'border-accent bg-accent/5 text-accent' : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <LocationButton onLocate={applyLocation} />

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Search Address
        </label>
      <AddressSearch onSelect={applySearchResult} city={data.city} state={data.state} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Full Name" name="name" value={data.name} onChange={handleChange} error={errors.name} autoComplete="name" />
        <Field label="Phone" name="phone" type="tel" value={data.phone} onChange={handleChange} error={errors.phone} autoComplete="tel" maxLength={10} />

        <Field
          label="Address Line 1 (House No, Building, Street)"
          name="address1"
          value={data.address1}
          onChange={handleChange}
          error={errors.address1}
          autoComplete="address-line1"
          className="md:col-span-2"
        />
        <Field
          label="Address Line 2 (Optional)"
          name="address2"
          value={data.address2}
          onChange={handleChange}
          error={errors.address2}
          autoComplete="address-line2"
          className="md:col-span-2"
        />
        <Field label="Landmark (Optional)" name="landmark" value={data.landmark} onChange={handleChange} autoComplete="off" />
        <Field label="Area / Locality" name="area" value={data.area} onChange={handleChange} autoComplete="off" />

        <Field label="City" name="city" value={data.city} onChange={handleChange} error={errors.city} autoComplete="address-level2" />
        <Field label="State" name="state" value={data.state} onChange={handleChange} error={errors.state} autoComplete="address-level1" />
        <Field label="Pincode" name="pincode" value={data.pincode} onChange={handleChange} error={errors.pincode} autoComplete="postal-code" maxLength={6} />
        <Field label="Country" name="country" value={data.country || 'India'} onChange={handleChange} autoComplete="country-name" />
      </div>

      <button
        type="submit"
        disabled={submitting || verifying}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal py-4 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
      >
        {(submitting || verifying) && <Loader2 size={16} className="animate-spin" />}
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
