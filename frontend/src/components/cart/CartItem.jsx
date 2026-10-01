import React from "react";
import {
  Trash2,
  Leaf,
  Droplets,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/currency";

export default function CartItem({ item }) {
  const {
    updateQty,
    removeFromCart,
    cartCurrency,
  } = useCart();

  const productId = item.productId || item.id;
  const cartItemId = item.cartItemId || item.id;

  const name = item.name || "Product";
  const brand = item.brand || "";

  const images = Array.isArray(item.images)
    ? item.images
    : [];

  const price = Number(
    item.salePrice ?? item.price ?? 0
  );

  const originalPrice = Number(
    item.compareAtPrice ??
      item.originalPrice ??
      item.price ??
      0
  );

  const qty =
    Number(item.quantity ?? item.qty ?? 1) || 1;

  return (
    <div className="group relative grid gap-4 rounded-2xl border border-white/10 bg-[#111] p-4 transition-all duration-300 hover:border-[#ff2f8a]/40 sm:grid-cols-[145px_minmax(0,1fr)_auto] sm:items-center sm:p-5">

      {/* PRODUCT IMAGE */}
      <Link
        to={`/products/${productId}`}
        className="mx-auto sm:mx-0"
      >
        <div className="relative h-[145px] w-[145px] overflow-hidden rounded-2xl border border-white/10 bg-[#1a1518]">

          <img
            src={images[0] || "/placeholder.jpg"}
            alt={name}
            className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          />

          {/* CHECK ICON */}
          <div className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-[#ff2f8a] shadow-lg">
            <span className="text-sm font-bold text-white">
              ✓
            </span>
          </div>
        </div>
      </Link>

      {/* PRODUCT DETAILS */}
      <div className="min-w-0">

        {brand && (
          <span className="mb-2 inline-flex rounded-md bg-[#ff2f8a]/15 px-2.5 py-1 text-xs font-semibold text-[#ff5ba5]">
            {brand}
          </span>
        )}

        <Link to={`/products/${productId}`}>
          <h3 className="text-lg font-bold leading-6 text-white transition hover:text-[#ff2f8a] sm:text-xl">
            {name}
          </h3>
        </Link>

        {/* FEATURES */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">

          <span className="flex items-center gap-1.5">
            <Leaf
              size={18}
              className="text-[#ff2f8a]"
            />
            Natural Formula
          </span>

          <span className="flex items-center gap-1.5">
            <Droplets
              size={18}
              className="text-[#ff2f8a]"
            />
            Ammonia Free
          </span>

          <span className="flex items-center gap-1.5">
            <Star
              size={18}
              className="text-[#ff2f8a]"
            />
            Long Lasting
          </span>
        </div>

        {/* STOCK */}
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          In stock
        </div>

        {/* MOBILE PRICE */}
        <div className="mt-4 sm:hidden">
          <p className="text-xl font-bold text-[#ff2f8a]">
            {formatCurrency(price, cartCurrency)}
          </p>

          {originalPrice > price && (
            <p className="text-sm text-slate-500 line-through">
              {formatCurrency(
                originalPrice,
                cartCurrency
              )}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">

        {/* PRICE */}
        <div className="hidden text-right sm:block">
          <p className="text-xl font-bold text-[#ff2f8a]">
            {formatCurrency(price, cartCurrency)}
          </p>

          {originalPrice > price && (
            <p className="text-sm text-slate-500 line-through">
              {formatCurrency(
                originalPrice,
                cartCurrency
              )}
            </p>
          )}
        </div>

        {/* QUANTITY + DELETE */}
        <div className="flex items-center gap-3">

          <div className="flex h-12 items-center overflow-hidden rounded-xl border border-white/10 bg-[#181818]">

            <button
              type="button"
              onClick={() =>
                updateQty(
                  cartItemId,
                  qty - 1
                )
              }
              className="flex h-full w-12 items-center justify-center text-lg font-bold text-[#ff2f8a] transition hover:bg-[#ff2f8a]/10"
            >
              −
            </button>

            <span className="flex w-10 justify-center text-sm font-semibold text-white">
              {qty}
            </span>

            <button
              type="button"
              onClick={() =>
                updateQty(
                  cartItemId,
                  qty + 1
                )
              }
              className="flex h-full w-12 items-center justify-center text-lg font-bold text-[#ff2f8a] transition hover:bg-[#ff2f8a]/10"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              removeFromCart(cartItemId)
            }
            aria-label={`Remove ${name}`}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-[#ff8abb] transition hover:border-[#ff2f8a] hover:bg-[#ff2f8a]/10 hover:text-[#ff2f8a]"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}