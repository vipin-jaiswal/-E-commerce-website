import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
  Home,
  ChevronRight,
} from "lucide-react";

import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import CouponBox from "../components/cart/CouponBox";
import { useCart } from "../hooks/useCart";

export default function Cart() {
  const { items, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-theme min-h-screen bg-[#090909] px-4 py-16 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-[#111] p-10 text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#351323]">
              <ShoppingBag size={48} className="text-[#ff2f8a]" />
            </div>

            <h2 className="mb-3 text-3xl font-bold">
              Your Cart is Empty
            </h2>

            <p className="mb-8 text-slate-400">
              Looks like you haven't added any products yet.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-[#ff2f8a] px-8 py-3 font-semibold text-white transition hover:bg-[#ff167c]"
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="cart-theme min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1430px]">

        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Your{" "}
              <span className="text-[#ff2f8a]">
                Shopping Cart
              </span>
            </h1>

            <p className="mt-2 text-base text-slate-300 sm:text-lg">
              Review your items and proceed to checkout
            </p>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Home size={17} />
            <span>Home</span>
            <ChevronRight size={16} />
            <span className="text-[#ff2f8a]">Cart</span>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_490px]">

          {/* LEFT */}
          <div className="min-w-0">

            {/* CART ITEMS BOX */}
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0d]">

              {/* CART HEADER */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ff2f8a]">
                    <span className="text-sm font-bold text-white">
                      ✓
                    </span>
                  </div>

                  <span className="text-sm font-medium text-slate-200 sm:text-base">
                    {items.length} item{items.length !== 1 ? "s" : ""} selected
                  </span>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-[#ff2f8a]"
                >
                  <Trash2 size={18} />
                  <span className="hidden sm:inline">
                    Clear Cart
                  </span>
                </button>
              </div>

              {/* ITEMS */}
              <div className="p-3 sm:p-4">
                {items.map((item) => (
                  <CartItem
                    key={item.cartItemId || item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* COUPON */}
            <div className="mt-4">
              <CouponBox />
            </div>

          </div>

          {/* RIGHT SUMMARY */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-[#ff2f8a]/40 bg-[#111] p-6 shadow-[0_0_35px_rgba(255,47,138,0.06)] sm:p-7">
              <CartSummary />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
