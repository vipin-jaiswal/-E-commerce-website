import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Rating from "../common/Rating";
import { useCart } from "../../hooks/useCart";
import { useWishlist } from "../../hooks/useWishlist";
import toast from "react-hot-toast";

export const demoProducts = [
  {
    id: "1",
    name: "Vitamin C Face Serum",
    brand: "GlowCare",
    price: 999,
    salePrice: 799,
    rating: 4.8,
    numReviews: 210,
    images: ["https://images.unsplash.com/photo-1612817288484-6f916006741a?w=500"],
  },
  {
    id: "2",
    name: "Hydrating Moisturizer",
    brand: "Lumiere",
    price: 1299,
    salePrice: 999,
    rating: 4.6,
    numReviews: 126,
    images: ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500"],
  },
  {
    id: "3",
    name: "Hair Repair Shampoo",
    brand: "Pure Hair",
    price: 699,
    salePrice: 549,
    rating: 4.5,
    numReviews: 89,
    images: ["https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500"],
  },
  {
    id: "4",
    name: "Sunscreen SPF 50",
    brand: "SunGlow",
    price: 899,
    salePrice: 699,
    rating: 4.7,
    numReviews: 152,
    images: ["https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=500"],
  },
  {
    id: "5",
    name: "Night Repair Cream",
    brand: "DermaCare",
    price: 1499,
    salePrice: 1199,
    rating: 4.9,
    numReviews: 310,
    images: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=500"],
  },
];

export default function ProductCard({ product = demoProducts[0] }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const item = product;
  const wishlisted = isWishlisted(item.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(item);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not add item");
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  const image = item.images?.[0] || "/placeholder.jpg";

  return (
    <article className="group w-full overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-sm dark:shadow-none hover:shadow-md transition-all duration-300 border border-transparent dark:border-white/10">
      <div className="relative bg-gray-100 dark:bg-slate-800">
        <Link to={`/products/${item.id}`}>
          <img
            src={image}
            alt={item.name}
            className="w-full h-36 md:h-40 object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>

        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white dark:bg-slate-900 shadow flex items-center justify-center border border-slate-100 dark:border-white/10"
        >
          <Heart
            size={14}
            className={wishlisted ? "fill-pink-500 text-pink-500 dark:fill-pink-400 dark:text-pink-400" : "text-slate-500 dark:text-slate-300"}
          />
        </button>
      </div>

      <div className="p-2">
        <p className="text-[9px] uppercase text-gray-400 dark:text-slate-400 tracking-wider">
          {item.brand}
        </p>

        <Link to={`/products/${item.id}`}>
          <h3 className="text-xs md:text-sm font-semibold mt-1 line-clamp-2 min-h-[32px] text-gray-900 dark:text-slate-100">
            {item.name}
          </h3>
        </Link>

        <div className="mt-1">
          <Rating value={item.rating} count={item.numReviews} size={10} />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
            ₹{Number(item.salePrice).toLocaleString("en-IN")}
          </span>

          {item.salePrice !== item.price && (
            <span className="text-[10px] text-gray-400 dark:text-slate-500 line-through">
              ₹{Number(item.price).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full mt-2 bg-gray-900 dark:bg-slate-800 hover:bg-pink-500 dark:hover:bg-pink-500 text-white text-xs py-2 rounded-full transition"
        >
          Buy Now
        </button>
      </div>
    </article>
  );
}
