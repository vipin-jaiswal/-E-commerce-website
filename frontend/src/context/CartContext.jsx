import React, { createContext, useEffect, useMemo, useState } from 'react';

export const CartContext = createContext(null);

const LS_KEY = "cart";

const readLocalCart = () => {
  try {
    const savedCart = localStorage.getItem(LS_KEY);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
};

const writeLocalCart = (items) => {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
};

const normalizeItem = (item) => {
  const product = item?.product ?? item ?? {};
  const productId = item?.productId ?? product.id ?? item?.id;
  const quantity = Number(item?.quantity ?? item?.qty ?? 1) || 1;

  return {
    ...product,
    ...item,
    id: productId,
    productId,
    cartItemId: item?.cartItemId ?? (item?.product ? item.id : undefined),
    quantity,
    qty: quantity,
    price: Number(item?.price ?? product.price ?? 0),
    salePrice:
      item?.salePrice === null || item?.salePrice === undefined
        ? product.salePrice ?? null
        : Number(item.salePrice),
    images: Array.isArray(product.images) ? product.images : item?.images ?? [],
  };
};

const asLocalCartItem = (product, quantity = 1) => ({
  ...product,
  id: product.id,
  productId: product.id,
  quantity,
  qty: quantity,
  price: Number(product.price ?? 0),
  salePrice: product.salePrice ?? null,
  images: Array.isArray(product.images) ? product.images : [],
});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => readLocalCart().map(normalizeItem));

  useEffect(() => {
    writeLocalCart(items);
  }, [items]);

  const addToCart = async (product) => {
    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);

      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Number(item.quantity ?? item.qty ?? 1) + 1,
                qty: Number(item.quantity ?? item.qty ?? 1) + 1,
              }
            : item
        );
      }

      return [...prevItems, asLocalCartItem(product, 1)];
    });
  };

  const removeFromCart = async (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQty = async (id, quantity) => {
    if (quantity < 1) {
      return removeFromCart(id);
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity, qty: quantity } : item
      )
    );
  };

  const clearCart = async () => {
    setItems([]);
  };

  const cartCount = useMemo(
    () => items.reduce((total, item) => total + Number(item.quantity ?? item.qty ?? 0), 0),
    [items]
  );

  const cartTotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Number(item.salePrice ?? item.price ?? 0) *
            Number(item.quantity ?? item.qty ?? 0),
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
