import React from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  ArrowLeft,
} from "lucide-react";

import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import { useCart } from "../hooks/useCart";

export default function Cart() {
  const { items, clearCart } = useCart();

  // Empty Cart
  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 shadow-xl dark:shadow-none rounded-3xl p-10 text-center max-w-md w-full border border-slate-100 dark:border-white/10 transition-colors duration-300">

          <div className="w-24 h-24 bg-pink-100 dark:bg-pink-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag
              size={50}
              className="text-pink-500 dark:text-pink-300"
            />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 dark:text-slate-100 mb-3">
            Your Cart is Empty
          </h2>

          <p className="text-gray-500 dark:text-slate-400 mb-8">
            Looks like you haven't added any products yet.
          </p>

          <Link
            to="/products"
            className="
              inline-flex
              items-center
              gap-2
              bg-pink-500
              hover:bg-pink-600
              text-white
              px-8
              py-3
              rounded-full
              font-semibold
              transition
            "
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>

        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 transition-colors duration-300">
      <div className="max-w-[1500px] mx-auto">

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md dark:shadow-none p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-slate-100 dark:border-white/10 transition-colors duration-300">

          <div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-slate-100">
              Shopping Cart
            </h1>

            <p className="text-gray-500 dark:text-slate-400 mt-2">
              {items.length} item{items.length > 1 ? "s" : ""} in your cart
            </p>
          </div>

          <button
            onClick={clearCart}
            className="
              flex
              items-center
              gap-2
              bg-red-50
              text-red-500
              px-5
              py-3
              rounded-full
              hover:bg-red-500
              hover:text-white
              transition
            "
          >
            <Trash2 size={18} />
            Clear Cart
          </button>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="
                  bg-white dark:bg-slate-900
                  rounded-3xl
                  shadow-md dark:shadow-none
                  hover:shadow-lg
                  transition
                  overflow-hidden
                  border border-slate-100 dark:border-white/10
                "
              >
                <CartItem item={item} />
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="
              bg-white dark:bg-slate-900
              rounded-3xl
              shadow-lg dark:shadow-none
              p-6
              border
              border-pink-100 dark:border-white/10
            ">
              <CartSummary />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
