import React, { createContext, useEffect, useMemo, useState } from 'react';
import { cartService } from '../services/cartService';

export const CartContext = createContext(null);

const CART_ID_KEY = 'shopifyCartId';
const isShopifyCartId = (value) =>
  typeof value === 'string' && value.startsWith('gid://shopify/Cart/');

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
  const [cartId, setCartId] = useState(() => {
    const storedCartId = localStorage.getItem(CART_ID_KEY);
    return isShopifyCartId(storedCartId) ? storedCartId : null;
  });
  const [cart, setCart] = useState({ items: [], subtotalPrice: 0, totalPrice: 0, currencyCode: 'INR' });

  useEffect(() => {
    if (!cartId) return;
    cartService.get(cartId)
      .then(setCart)
      .catch((error) => {
        if (error.response?.status === 404) {
          localStorage.removeItem(CART_ID_KEY);
          setCartId(null);
          setCart({ items: [], subtotalPrice: 0, totalPrice: 0, currencyCode: 'INR' });
        }
      });
  }, [cartId]);

  const rememberCart = (nextCart) => {
    setCart(nextCart);
    const nextCartId = nextCart?.cartId || nextCart?.id;
    if (isShopifyCartId(nextCartId)) {
      localStorage.setItem(CART_ID_KEY, nextCartId);
      setCartId(nextCartId);
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

  const applyDiscountCode = async (code) => {
    if (!cartId) throw new Error('Your Shopify cart is empty.');
    const result = await cartService.updateDiscountCode(cartId, code);
    rememberCart(result.cart);
    if (!result.discount?.applicable) {
      throw new Error(`Discount code ${code} is not valid for this cart.`);
    }
    return result.discount;
  };

  const removeDiscountCode = async () => {
    if (!cartId) return;
    return rememberCart((await cartService.updateDiscountCode(cartId, '')).cart);
  };

  const clearCart = async () => {
    if (cartId) await cartService.clear(cartId);
    localStorage.removeItem(CART_ID_KEY);
    setCartId(null);
    setCart({ items: [], subtotalPrice: 0, totalPrice: 0, currencyCode: 'INR' });
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
        applyDiscountCode,
        removeDiscountCode,
        clearCart,
        cartCount,
        cartSubtotal: Number(cart.subtotalPrice ?? cart.totalPrice ?? 0),
        // Product amount after discounts; shipping and taxes are shown by Shopify checkout.
        cartTotal: Number(cart.merchandiseTotalPrice ?? cart.subtotalPrice ?? cart.totalPrice ?? 0),
        cartCurrency: cart.currencyCode || 'INR',
        cartDiscountCodes: cart.discountCodes || [],
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
