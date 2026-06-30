import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Rating from "../common/Rating";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  if (!product) return null;

  const productId = product.id || product._id;
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null;
  const wishlisted = isWishlisted(productId);
  const price = Number(product.salePrice ?? product.price ?? 0);
  const originalPrice =
    product.salePrice !== null && product.salePrice !== undefined && product.salePrice !== product.price
      ? Number(product.price ?? 0)
      : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      ...product,
      id: productId,
    });

    toast.success("Added to cart");
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

  return (
    <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100">
      <div className="relative overflow-hidden bg-gray-100">
        <Link to={`/products/${productId}`}>
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="w-full h-44 object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-pink-50 to-slate-100 text-xs uppercase tracking-[0.25em] text-slate-400">
              No Image
            </div>
          )}
        </Link>

        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-pink-50 transition"
        >
          <Heart
            size={18}
            className={wishlisted ? "fill-pink-500 text-pink-500" : "text-gray-500"}
          />
        </button>

        {product.salePrice && product.salePrice < product.price && (
          <span className="absolute top-3 left-3 bg-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            SALE
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-400">
          {product.brand}
        </p>

        <Link to={`/products/${productId}`}>
          <h3 className="mt-2 text-sm font-semibold text-gray-800 line-clamp-2 min-h-[42px] hover:text-pink-500 transition">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2">
          <Rating
            value={product.rating}
            count={product.numReviews}
            size={12}
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-bold text-pink-600">
            Rs. {price.toLocaleString("en-IN")}
          </span>

          {originalPrice !== null && (
            <span className="text-sm text-gray-400 line-through">
              Rs. {originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full mt-4 bg-gray-900 hover:bg-pink-500 text-white py-2.5 rounded-full font-medium transition duration-300"
        >
          Add To Cart
        </button>
      </div>
    </article>
  );
}
