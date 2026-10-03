import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Rating from "../common/Rating";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import toast from "react-hot-toast";
import { formatCurrency } from "../../utils/currency";
import { useReviewStats } from "../../context/ReviewStatsContext";

export default function ProductCard({ product }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!product) return null;

  const productId = product.id || product._id;
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
  const image = images[currentImageIndex] || null;
  const wishlisted = isWishlisted(productId);
  const price = Number(product.salePrice ?? product.price ?? 0);
  const originalPrice =
    product.salePrice !== null && product.salePrice !== undefined && product.salePrice !== product.price
      ? Number(product.price ?? 0)
      : null;
  const isComingSoon = Boolean(product.comingSoon);
  const variants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : [];
  const hasAvailableVariant = variants.some((variant) => variant.availableForSale === true);
  const isOutOfStock = !isComingSoon && (variants.length > 0 ? !hasAvailableVariant : product.availableForSale === false);
  const reviewStats = useReviewStats(product.handle);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart({ ...product, id: productId });
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not add item");
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    toggleWishlist({
      ...product,
      id: productId,
    });

    toast.success(wishlisted ? "Removed from wishlist" : "Added to wishlist");
  };

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <article className="ui-card group mx-auto flex h-[248px] w-full flex-col overflow-hidden sm:block sm:h-auto sm:max-w-[18rem]">
      <div className="relative overflow-hidden bg-[#fff5f9] dark:bg-[#191216]">
        <Link to={`/products/${productId}`}>
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-[104px] w-full object-contain bg-[#fff5f9] transition duration-500 group-hover:scale-[1.025] dark:bg-[#191216] sm:h-60"
            />
          ) : (
            <div className="flex h-[104px] w-full items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100 text-[10px] uppercase tracking-[0.2em] text-slate-400 sm:h-56 sm:text-xs sm:tracking-[0.25em]">
              No Image
            </div>
          )}
        </Link>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous product image"
              className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition hover:text-primary dark:bg-[#202020] dark:text-slate-200 sm:left-3 sm:h-9 sm:w-9"
            >
              <ChevronLeft size={16} className="sm:h-5 sm:w-5" />
            </button>

            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next product image"
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition hover:text-primary dark:bg-[#202020] dark:text-slate-200 sm:right-3 sm:h-9 sm:w-9"
            >
              <ChevronRight size={16} className="sm:h-5 sm:w-5" />
            </button>
          </>
        )}

        <button
          onClick={handleWishlist}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition hover:bg-gray-50 dark:bg-slate-700 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
        >
          <Heart
            size={18}
            className={`sm:h-[18px] sm:w-[18px] ${wishlisted ? "fill-primary text-primary" : "text-gray-500 dark:text-slate-400"}`}
          />
        </button>

        {product.salePrice && product.salePrice < product.price && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-white sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-xs">
            SALE
          </span>
        )}

        {isComingSoon && (
          <span className="absolute left-2 top-9 rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-white sm:left-3 sm:top-12 sm:px-3 sm:py-1 sm:text-xs">
            COMING SOON
          </span>
        )}
        {!isComingSoon && isOutOfStock && (
          <span className="absolute left-2 top-9 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold text-white sm:left-3 sm:top-12 sm:px-3 sm:py-1 sm:text-xs">
            OUT OF STOCK
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2 sm:block sm:p-4">
        <p className="text-[8px] uppercase tracking-wider text-gray-400 dark:text-slate-500 sm:text-[10px] sm:tracking-widest">
          {product.brand}
        </p>

        <Link to={`/products/${productId}`}>
          <h3 className="mt-1 min-h-[30px] line-clamp-2 text-[10px] font-semibold leading-[15px] text-gray-800 transition hover:text-primary dark:text-slate-100 dark:hover:text-primary sm:mt-2 sm:min-h-[42px] sm:text-sm sm:leading-normal">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2">
          <Rating
            value={reviewStats?.rating ?? product.rating ?? 0}
            count={reviewStats?.count ?? product.reviewCount ?? product.numReviews ?? 0}
            size={12}
          />
        </div>

        <div className="mt-1.5 flex items-center gap-1 sm:mt-3 sm:gap-2">
          <span className="text-xs font-bold text-[#d93b7f] dark:text-primary-dark sm:text-lg">
            {formatCurrency(price)}
          </span>

          {originalPrice !== null && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 line-through sm:text-sm">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isComingSoon || isOutOfStock}
          className={`mt-auto w-full rounded-full py-1.5 text-[10px] font-medium transition duration-300 sm:mt-4 sm:rounded-xl sm:px-5 sm:py-3 sm:text-base ${
            isComingSoon
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 cursor-not-allowed border border-amber-200 dark:border-amber-800/40"
              : isOutOfStock
              ? "bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
              : "ui-primary"
          }`}
        >
          {isComingSoon ? "Coming Soon" : isOutOfStock ? "Out of Stock" : "Add To Cart"}
        </button>
      </div>
    </article>
  );
}
