import React, { createContext, useEffect, useState } from 'react';

export const WishlistContext = createContext(null);

const LS_KEY = 'lumiere_wishlist';

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const toggleWishlist = (product) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      return exists
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product];
    });
  };

  const isWishlisted = (id) => items.some((item) => item.id === id);

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider value={{ items, toggleWishlist, isWishlisted, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}
