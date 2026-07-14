import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefault,
  updateAddress,
} from '../services/addressService';
import { useAuth } from '../hooks/useAuth';

const AddressContext = createContext(null);

export function AddressProvider({ children }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultAddress = addresses.find((a) => a.isDefault);

  const loadAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.assign('/login');
        return;
      }
      toast.error(err.response?.data?.message || err.message || 'Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const addAddress = async (payload) => {
    const saved = await createAddress(payload);
    setAddresses((prev) => [saved, ...prev]);
    toast.success('Address saved!');
    return saved;
  };

  const editAddress = async (id, payload) => {
    const saved = await updateAddress(id, payload);
    setAddresses((prev) => prev.map((a) => (a._id === id ? saved : a)));
    toast.success('Address updated!');
    return saved;
  };

  const removeAddress = async (id) => {
    await deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a._id !== id));
    toast.success('Address removed.');
  };

  const makeDefault = async (id) => {
    const saved = await setDefault(id);
    setAddresses((prev) => prev.map((a) => (a._id === id ? saved : { ...a, isDefault: false })));
    toast.success('Default address updated.');
  };

  const value = {
    addresses,
    loading,
    defaultAddress,
    loadAddresses,
    addAddress,
    editAddress,
    removeAddress,
    makeDefault,
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddress() {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
}
