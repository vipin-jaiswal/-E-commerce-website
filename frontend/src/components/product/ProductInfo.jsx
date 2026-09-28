import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShieldCheck } from 'lucide-react';
import Rating from '../common/Rating';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../utils/currency';

export default function ProductInfo({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const variants = Array.isArray(product?.variants) && product.variants.length > 0 ? product.variants : [];
  const [selectedVariantId, setSelectedVariantId] = useState(() => variants[0]?.id || null);

  // Sync selected variant when product changes
  useEffect(() => {
    if (variants.length > 0 && (!selectedVariantId || !variants.some((v) => v.id === selectedVariantId))) {
      setSelectedVariantId(variants[0].id);
    }
  }, [product, variants, selectedVariantId]);

  if (!product) return null;

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || variants[0] || null;
  const wishlisted = isWishlisted(product.id);
  const isComingSoon = Boolean(product.comingSoon);
  const isOutOfStock = !isComingSoon && (selectedVariant ? selectedVariant.availableForSale === false : product.availableForSale === false);

  const price = Number(selectedVariant?.price ?? product.salePrice ?? product.price ?? 0);
  const originalPrice = selectedVariant?.compareAtPrice
    ? Number(selectedVariant.compareAtPrice)
    : (product.salePrice && product.price && product.salePrice !== product.price ? Number(product.price) : null);

  const reviewCount = product.reviewCount || 0;
  const reviewRating = product.rating || 0;

  const handleAddToCart = async () => {
    if (isComingSoon || isOutOfStock) return;
    try {
      await addToCart(product, selectedVariant?.title);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not add item');
    }
  };

  const handleBuyNow = async () => {
    if (isComingSoon || isOutOfStock) return;
    try {
      await addToCart(product, selectedVariant?.title);
      toast.success('Added to cart');
      const checkoutPath = '/checkout';
      navigate(localStorage.getItem('token') ? checkoutPath : `/login?returnTo=${encodeURIComponent(checkoutPath)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not add item');
    }
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const hasMultipleRealVariants = variants.length > 1 && variants.some((v) => v.title && v.title !== 'Default Title');

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted dark:text-slate-400">
          {product.brand || 'DYVA'}
        </p>
        <h1 className="font-display text-4xl font-semibold text-charcoal dark:text-slate-100">
          {product.name}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2" aria-label={`${reviewRating.toFixed(1)} out of 5 stars from ${reviewCount} reviews`}>
          <Rating value={reviewRating} count={reviewCount} />
          {reviewCount > 0 && (
            <span className="text-sm font-medium text-charcoal dark:text-slate-200">
              {reviewRating.toFixed(1)} / 5
            </span>
          )}
        </div>
        <span className="text-sm text-muted dark:text-slate-400">
          {product.category || 'Hair Care'}
        </span>
      </div>

      <div className="flex items-end gap-3 dark:text-slate-100">
        <span className="text-3xl font-semibold text-charcoal dark:text-white">
          {formatCurrency(price)}
        </span>
        {originalPrice && originalPrice > price && (
          <span className="pb-1 text-sm text-muted dark:text-slate-400 line-through">
            {formatCurrency(originalPrice)}
          </span>
        )}
      </div>

      {isComingSoon && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold text-sm">Coming Soon</p>
          <p className="text-xs mt-1 text-amber-800/80 dark:text-amber-300/80">
            This collection is coming soon. Products in this category will be available for purchase upon launch.
          </p>
        </div>
      )}

      <p className="max-w-2xl leading-7 text-muted dark:text-slate-400">
        {product.description}
      </p>

      {hasMultipleRealVariants && (
        <div>
          <p className="mb-3 text-sm font-semibold text-charcoal dark:text-slate-100">Select option</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = (selectedVariant?.id === variant.id);
              const variantInStock = variant.availableForSale !== false;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedVariantId(variant.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : variantInStock
                      ? 'border-border bg-white text-charcoal hover:border-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      : 'border-dashed border-gray-300 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                  }`}
                >
                  {variant.title} {!variantInStock ? '(Out of Stock)' : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-3 rounded-3xl border border-border bg-white dark:border-[#2A2A2A] dark:bg-[#151515] p-5 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <p className="text-sm font-semibold text-charcoal dark:text-slate-200">Authentic products</p>
            <p className="text-xs text-muted dark:text-slate-400">Handpicked beauty essentials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <p className="text-sm font-semibold text-charcoal dark:text-slate-200">Fast shipping</p>
            <p className="text-xs text-muted dark:text-slate-400">Quick delivery across India</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <p className="text-sm font-semibold text-charcoal dark:text-slate-200">Easy returns</p>
            <p className="text-xs text-muted dark:text-slate-400">Hassle-free support</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {!isComingSoon && !isOutOfStock && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="ui-primary inline-flex items-center gap-2 rounded-pill px-6 py-3 text-sm"
          >
            <ShoppingBag size={16} />
            Add to cart
          </button>
        )}
        {!isComingSoon && !isOutOfStock && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="ui-outline inline-flex items-center gap-2 rounded-pill px-6 py-3 text-sm"
          >
            <ShoppingBag size={16} />
            Buy Now
          </button>
        )}
        {isOutOfStock && (
          <p className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
            Sorry, this product is currently out of stock.
          </p>
        )}
        {isComingSoon && (
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-2 rounded-pill bg-amber-500/20 px-6 py-3 text-sm font-semibold text-amber-800 dark:text-amber-300 cursor-not-allowed"
          >
            Coming Soon
          </button>
        )}
        <button
          type="button"
          onClick={handleWishlist}
          className={`inline-flex items-center gap-2 rounded-pill border px-5 py-3 text-sm font-semibold transition-colors ${
            wishlisted
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-white text-charcoal hover:border-charcoal dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-100'
          }`}
        >
          <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
          {wishlisted ? 'Saved' : 'Save for later'}
        </button>
      </div>

      <div className="text-sm text-muted dark:text-slate-400">
        Status:{' '}
        {isComingSoon ? (
          <span className="font-medium text-amber-600 dark:text-amber-400">Coming Soon</span>
        ) : isOutOfStock ? (
          <span className="font-medium text-red-600 dark:text-red-400">Out of Stock</span>
        ) : (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">In Stock</span>
        )}
      </div>

    </div>
    
  );
}
