import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import AddressForm from './AddressForm';
import { useAddress } from '../../context/AddressContext';

const EMPTY_ADDRESS = {
  type: 'Home',
  name: '',
  phone: '',
  address1: '',
  address2: '',
  landmark: '',
  area: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  latitude: null,
  longitude: null,
  isDefault: false,
};

export default function AddressModal({ address, onClose, onSaved }) {
  const { addAddress, editAddress } = useAddress();
  const [data, setData] = useState(address ? { ...address } : EMPTY_ADDRESS);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(address?._id);

  const handleSubmit = async (sanitized) => {
    setSubmitting(true);
    try {
      const saved = isEdit ? await editAddress(address._id, sanitized) : await addAddress(sanitized);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl sm:max-w-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-charcoal">
            {isEdit ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-ivory-dark hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        <AddressForm
          data={data}
          onChange={setData}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel={isEdit ? 'Update Address' : 'Save Address'}
        />
      </div>
    </div>
  );
}
