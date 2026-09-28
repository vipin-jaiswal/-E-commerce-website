import React, { createContext, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';

export const CartContext = createContext(null);

const CART_ID_KEY = 'shopifyCartId';

const getVariantId = (product, weight = '') => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const selected = variants.find((variant) => variant.title === weight);
  return selected?.id || variants[0]?.id || product?.variantId;
};

const getSelectedVariant = (product, weight = '') => {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find((variant) => variant.title === weight) || variants[0] || null;
};

export const CartProvider = ({ children }) => {
  const [cartId, setCartId] = useState(() => localStorage.getItem(CART_ID_KEY));
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });

  useEffect(() => {
    if (!cartId) return;
    cartService.get(cartId)
      .then(setCart)
      .catch((error) => {
        if (error.response?.status === 404) {
          localStorage.removeItem(CART_ID_KEY);
          setCartId(null);
          setCart({ items: [], totalPrice: 0 });
        }
      });
  }, [cartId]);

  const rememberCart = (nextCart) => {
    setCart(nextCart);
    if (nextCart?.cartId) {
      localStorage.setItem(CART_ID_KEY, nextCart.cartId);
      setCartId(nextCart.cartId);
    }
    return nextCart;
  };

  const addToCart = async (product, variantTitleOrId = '') => {
    if (product?.comingSoon) {
      throw new Error('This product is coming soon and cannot be purchased yet.');
    }

    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const selectedVariant =
      variants.find((v) => v.id === variantTitleOrId || v.title === variantTitleOrId) ||
      variants.find((v) => v.availableForSale) ||
      variants[0] ||
      null;

    if (selectedVariant?.availableForSale === false || (!selectedVariant && product?.availableForSale === false)) {
      throw new Error('This product is out of stock.');
    }

    const variantId = selectedVariant?.id || product?.variantId;
    if (!variantId) throw new Error('This product has no purchasable Shopify variant.');

    const nextCart = await cartService.add(cartId, variantId, 1);
    return rememberCart(nextCart);
  };

  const removeFromCart = async (lineId) => {
    if (!cartId) return;
    return rememberCart(await cartService.remove(cartId, lineId));
  };

  const updateQty = async (lineId, quantity) => {
    if (quantity < 1) return removeFromCart(lineId);
    if (!cartId) return;
    return rememberCart(await cartService.update(cartId, lineId, quantity));
  };

  const clearCart = async () => {
    if (cartId) await cartService.clear(cartId);
    localStorage.removeItem(CART_ID_KEY);
    setCartId(null);
    setCart({ items: [], totalPrice: 0 });
  };

  const cartCount = useMemo(
    () => cart.items.reduce((total, item) => total + Number(item.quantity || item.qty || 0), 0),
    [cart.items]
  );

  return (
    <CartContext.Provider
      value={{
        cartId,
        items: cart.items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
        cartTotal: Number(cart.totalPrice || 0),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
