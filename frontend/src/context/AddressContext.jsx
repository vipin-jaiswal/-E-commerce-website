import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import * as addressService from '../services/addressService';

const AddressContext = createContext(null);

export function AddressProvider({ children }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAddresses = useCallback(async () => {
    if (!user) {
      setAddresses([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const addAddress = useCallback(async (payload) => {
    const created = await addressService.createAddress(payload);
    setAddresses((prev) => {
      const next = created.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : prev;
      return [created, ...next];
    });
    toast.success('Address saved');
    return created;
  }, []);

  const editAddress = useCallback(async (id, payload) => {
    const updated = await addressService.updateAddress(id, payload);
    setAddresses((prev) =>
      prev.map((a) => {
        if (a._id === id) return updated;
        return updated.isDefault ? { ...a, isDefault: false } : a;
      })
    );
    toast.success('Address updated');
    return updated;
  }, []);

  const removeAddress = useCallback(async (id) => {
    await addressService.deleteAddress(id);
    setAddresses((prev) => prev.filter((a) => a._id !== id));
    toast.success('Address deleted');
  }, []);

  const makeDefault = useCallback(async (id) => {
    const updated = await addressService.setDefault(id);
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id ? true : false })).map((a) => (a._id === id ? updated : a)));
    toast.success('Default address updated');
    return updated;
  }, []);

  const value = {
    addresses,
    loading,
    error,
    refresh: fetchAddresses,
    addAddress,
    editAddress,
    removeAddress,
    makeDefault,
    defaultAddress: addresses.find((a) => a.isDefault) || addresses[0] || null,
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddress() {
  const ctx = useContext(AddressContext);
  if (!ctx) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return ctx;
}
