import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShieldCheck, MessageSquare, X } from 'lucide-react';
import Rating from '../common/Rating';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import ReviewForm from './ReviewForm';
import toast from 'react-hot-toast';

export default function ProductInfo({ product, reviewSummary, onReviewAdded }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const availableWeights = product?.weights?.length ? product.weights : ['50 gm', '100 gm', '150 gm'];
  const [selectedWeight, setSelectedWeight] = useState(availableWeights[0]);

  if (!product) return null;

  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = async () => {
    try {
      await addToCart(product, selectedWeight);
      toast.success('Added to cart');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add item');
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product, selectedWeight);
      toast.success('Added to cart');
      navigate('/checkout');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add item');
    }
  };

  const handleWishlist = () => {
    toggleWishlist(product);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const price = Number(product.salePrice ?? product.price ?? 0);
  const originalPrice =
    product.salePrice && product.price && product.salePrice !== product.price
      ? Number(product.price)
      : null;
  const reviewCount = reviewSummary?.count ?? product.numReviews ?? product.reviewCount ?? 0;
  const reviewRating = reviewSummary?.average ?? product.rating ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-muted dark:text-slate-400">
          {product.brand || 'Lumiere'}
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
          {product.category || 'Skincare'}
        </span>
      </div>

      <div className="flex items-end gap-3 dark:text-slate-100">
        <span className="text-3xl font-semibold text-charcoal ">
          Rs. {price.toLocaleString('en-IN')}
        </span>
        {originalPrice && (
          <span className="pb-1 text-sm text-muted dark:text-slate-400 line-through">
            Rs. {originalPrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {product.comingSoon && (
        <p className="inline-flex w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
          Coming soon — this product is not available to purchase yet.
        </p>
      )}

      <p className="max-w-2xl leading-7 text-muted dark:text-slate-400">
        {product.description}
      </p>

      <div>
        <p className="mb-3 text-sm font-semibold text-charcoal dark:text-slate-100">Select weight</p>
        <div className="flex flex-wrap gap-2">
          {availableWeights.map((weight) => (
            <button
              key={weight}
              type="button"
              onClick={() => setSelectedWeight(weight)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                selectedWeight === weight
                  ? 'border-pink-500 bg-pink-500 text-white'
                  : 'border-border bg-white text-charcoal hover:border-pink-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
              }`}
            >
              {weight}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-3xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800 p-5 sm:grid-cols-3">
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
        {!user?.isAdmin && !product.comingSoon && (
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex items-center gap-2 rounded-pill bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-600"
          >
            <ShoppingBag size={16} />
            Add to cart
          </button>
        )}
        {!user?.isAdmin && !product.comingSoon && (
          <button
            type="button"
            onClick={handleBuyNow}
            className="inline-flex items-center gap-2 rounded-pill bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-pink-600"
          >
            <ShoppingBag size={16} />
            Buy Now
          </button>
        )}
        {!user?.isAdmin && (
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
        )}
      </div>

      <div className="text-sm text-muted dark:text-slate-400">
        Stock: {Number(product.stock ?? 0)} available
      </div>

      {!user?.isAdmin && (
        <div className="border-t border-border dark:border-slate-700 pt-6">
        {isReviewFormOpen ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-charcoal dark:text-slate-100">Write a Review</h2>
              <button
                onClick={() => setIsReviewFormOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            <ReviewForm
              productId={product._id || product.id}
              onReviewAdded={(review) => {
                setIsReviewFormOpen(false);
                onReviewAdded?.(review);
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsReviewFormOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent dark:text-pink-400 hover:underline"
          >
            <MessageSquare size={16} />
            Write a review
          </button>
        )}
        </div>
      )}
    </div>
    
  );
}
