import React from "react";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/currency";

export default function CartSummary() {
  const navigate = useNavigate();

  const {
    cartSubtotal,
    cartTotal,
    cartCurrency,
    cartDiscountCodes,
    items,
  } = useCart();

  const appliedDiscount =
    cartDiscountCodes.find(
      (discount) => discount.applicable
    );

  const handleOrderNow = () => {
    const checkoutPath = "/checkout";

    navigate(
      localStorage.getItem("token")
        ? checkoutPath
        : `/login?returnTo=${encodeURIComponent(
            checkoutPath
          )}`
    );
  };

  return (
    <div>

      {/* TITLE */}
      <h2 className="mb-6 text-2xl font-bold text-white sm:text-3xl">
        Order Summary
      </h2>

      <div className="mb-6 h-px bg-white/10" />

      {/* PRODUCTS */}
      <div className="space-y-5 text-sm sm:text-base">

        <div className="flex justify-between gap-4">
          <span className="text-slate-300">
            Products ({items.length} item
            {items.length !== 1 ? "s" : ""})
          </span>

          <span className="font-semibold text-white">
            {formatCurrency(
              cartSubtotal,
              cartCurrency
            )}
          </span>
        </div>

        {/* DISCOUNT */}
        <div className="flex justify-between gap-4">
          <span className="text-slate-300">
            Discount code
          </span>

          <span
            className={
              appliedDiscount
                ? "font-semibold text-emerald-400"
                : "font-semibold text-emerald-400"
            }
          >
            {appliedDiscount
              ? `- ${formatCurrency(
                  0,
                  cartCurrency
                )}`
              : "- ₹0.00"}
          </span>
        </div>

        {/* SHIPPING */}
        <div className="flex justify-between gap-4">
          <span className="text-slate-300">
            Shipping & taxes
          </span>

          <span className="text-right text-slate-400">
            Calculated at checkout
          </span>
        </div>
      </div>

      {/* TOTAL */}
      <div className="my-6 h-px bg-white/10" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-xl font-bold text-white sm:text-2xl">
          Total
        </span>

        <span className="text-2xl font-extrabold text-[#ff2f8a] sm:text-3xl">
          {formatCurrency(
            cartTotal,
            cartCurrency
          )}
        </span>
      </div>

      {/* ORDER BUTTON */}
      <button
        type="button"
        onClick={handleOrderNow}
        className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-[#ff2f8a] py-4 text-base font-bold text-white shadow-[0_8px_25px_rgba(255,47,138,0.22)] transition hover:bg-[#ff167c] hover:shadow-[0_10px_30px_rgba(255,47,138,0.3)]"
      >
        Order Now
        <ArrowRight size={20} />
      </button>

      {/* OR */}
      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-400">
          OR
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* CONTINUE SHOPPING */}
      <button
        type="button"
        onClick={() => navigate("/products")}
        className="w-full rounded-2xl border border-[#ff2f8a] bg-transparent py-3.5 font-semibold text-white transition hover:bg-[#ff2f8a]/10"
      >
        Continue Shopping
      </button>

      {/* FEATURES */}
      <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-7">

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2f8a]/10">
            <Truck
              size={22}
              className="text-[#ff5ba5]"
            />
          </div>

          <p className="text-sm font-bold text-white">
            Free Shipping
          </p>

          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            On orders above ₹499
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2f8a]/10">
            <ShieldCheck
              size={22}
              className="text-[#ff5ba5]"
            />
          </div>

          <p className="text-sm font-bold text-white">
            Secure Payment
          </p>

          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            100% safe checkout
          </p>
        </div>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff2f8a]/10">
            <RotateCcw
              size={22}
              className="text-[#ff5ba5]"
            />
          </div>

          <p className="text-sm font-bold text-white">
            Easy Returns
          </p>

          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            7-day return policy
          </p>
        </div>

      </div>
    </div>
  );
}