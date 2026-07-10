import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAddress } from '../../context/AddressContext';
import AddressCard from './AddressCard';
import AddressModal from './AddressModal';
import { AddressListSkeleton, AddressEmptyState } from './AddressStates';

/**
 * Drop this into the checkout flow instead of an empty AddressForm.
 * Shows saved addresses when the user has any, falls back to prompting
 * "Add New Address" when they don't.
 */
export default function AddressSelector({ selectedId, onSelectAddress }) {
  const { addresses, loading, removeAddress, makeDefault, defaultAddress } = useAddress();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const activeId = selectedId || defaultAddress?._id;

  const openAdd = () => {
    setEditingAddress(null);
    setModalOpen(true);
  };

  const openEdit = (address) => {
    setEditingAddress(address);
    setModalOpen(true);
  };

  const handleDelete = async (address) => {
    if (!window.confirm('Delete this address?')) return;
    setBusyId(address._id);
    try {
      await removeAddress(address._id);
      if (activeId === address._id) onSelectAddress(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete address');
    } finally {
      setBusyId(null);
    }
  };

  const handleSetDefault = async (address) => {
    setBusyId(address._id);
    try {
      await makeDefault(address._id);
    } catch (err) {
      toast.error(err.message || 'Failed to set default address');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <AddressListSkeleton />;

  if (addresses.length === 0) {
    return (
      <>
        <AddressEmptyState onAddNew={openAdd} />
        {modalOpen && (
          <AddressModal
            address={editingAddress}
            onClose={() => setModalOpen(false)}
            onSaved={(saved) => onSelectAddress(saved._id)}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-charcoal">Choose Address</h3>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-dark"
        >
          <Plus size={15} /> Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <AddressCard
            key={address._id}
            address={address}
            selectable
            selected={activeId === address._id}
            onSelect={() => onSelectAddress(address._id)}
            onEdit={openEdit}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
            busy={busyId === address._id}
          />
        ))}
      </div>

      {modalOpen && (
        <AddressModal
          address={editingAddress}
          onClose={() => setModalOpen(false)}
          onSaved={(saved) => onSelectAddress(saved._id)}
        />
      )}
    </div>
  );
}
