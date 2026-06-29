import React from "react";
import { Truck, Tag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export default function CartSummary() {
  const navigate = useNavigate();
  const { items } = useCart();

  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.salePrice ?? item.price ?? 0);
    const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
    return acc + price * qty;
  }, 0);

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = subtotal + shipping;

  return (
    <div className="bg-transparent rounded-3xl p-0 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">Order Summary</h2>

      <div className="flex items-center gap-3 bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 rounded-2xl p-4 mb-6">
        <Tag size={18} className="text-pink-500 dark:text-pink-300" />
        <div>
          <p className="font-semibold text-gray-800 dark:text-slate-100">Apply Coupon</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Coupon support coming soon</p>
        </div>
      </div>

      <div className="space-y-4 text-gray-700 dark:text-slate-300">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          {shipping === 0 ? (
            <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
          ) : (
            <span>₹{shipping}</span>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex justify-between text-xl font-bold text-gray-900 dark:text-slate-100">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {subtotal < 499 && (
        <div className="mt-5 flex items-center gap-2 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-700 dark:text-yellow-200">
          <Truck size={18} />
          Add ₹{(499 - subtotal).toLocaleString("en-IN")} more for FREE delivery.
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/checkout")}
        className="w-full mt-6 bg-pink-500 hover:bg-pink-600 text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        Proceed to Checkout
        <ArrowRight size={18} />
      </button>

      <button
        type="button"
        onClick={() => navigate("/products")}
        className="w-full mt-4 border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white py-4 rounded-2xl font-semibold transition-all duration-300"
      >
        Continue Shopping
      </button>
    </div>
  );
}
