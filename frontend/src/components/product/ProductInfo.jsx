import React from 'react';
import { Heart, ShoppingBag, ShieldCheck } from 'lucide-react';
import Rating from '../common/Rating';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import toast from 'react-hot-toast';

export default function ProductInfo({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!product) return null;

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async () => {
    try {
      await addToCart(product);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add item');
    }
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const price = Number(product.salePrice ?? product.price ?? 0);
  const originalPrice = product.salePrice && product.price && product.salePrice !== product.price
    ? Number(product.price)
    : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted">
          {product.brand || 'Lumière'}
        </p>
        <h1 className="font-display text-4xl font-semibold text-charcoal">
          {product.name}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Rating value={product.rating} count={product.numReviews ?? product.reviewCount} />
        <span className="text-sm text-muted">
          {product.category || 'Skincare'}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-3xl font-semibold text-charcoal">
          ₹{price.toLocaleString('en-IN')}
        </span>
        {originalPrice && (
          <span className="pb-1 text-sm text-muted line-through">
            ₹{originalPrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      <p className="max-w-2xl leading-7 text-muted">
        {product.description}
      </p>

      <div className="grid gap-3 rounded-3xl border border-border bg-white p-5 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <p className="text-sm font-semibold text-charcoal">Authentic products</p>
            <p className="text-xs text-muted">Handpicked beauty essentials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <p className="text-sm font-semibold text-charcoal">Fast shipping</p>
            <p className="text-xs text-muted">Quick delivery across India</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={18} />
          <div>
            <p className="text-sm font-semibold text-charcoal">Easy returns</p>
            <p className="text-xs text-muted">Hassle-free support</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          className="inline-flex items-center gap-2 rounded-pill bg-charcoal px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          <ShoppingBag size={16} />
          Add to cart
        </button>
        <button
          type="button"
          onClick={handleWishlist}
          className={`inline-flex items-center gap-2 rounded-pill border px-5 py-3 text-sm font-semibold transition-colors ${
            wishlisted
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-white text-charcoal hover:border-charcoal'
          }`}
        >
          <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
          {wishlisted ? 'Saved' : 'Save for later'}
        </button>
      </div>

      <div className="text-sm text-muted">
        Stock: {Number(product.stock ?? 0)} available
      </div>
    </div>
  );
}
