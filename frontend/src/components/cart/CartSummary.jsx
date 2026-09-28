import React from "react";
import { Tag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/currency";

export default function CartSummary() {
  const navigate = useNavigate();
  const { items } = useCart();

  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.salePrice ?? item.price ?? 0);
    const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
    return acc + price * qty;
  }, 0);

  const total = subtotal;

  const handleOrderNow = () => {
    const checkoutPath = "/checkout";
    navigate(localStorage.getItem("token") ? checkoutPath : `/login?returnTo=${encodeURIComponent(checkoutPath)}`);
  };

  return (
    <div className="bg-transparent rounded-3xl p-0 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-6">Order Summary</h2>

      <div className="flex items-center gap-3 bg-gray-50 dark:bg-black/10 border border-gray-100 dark:border-black/20 rounded-2xl p-4 mb-6">
        <Tag size={18} className="text-black dark:text-gray-400" />
        <div>
          <p className="font-semibold text-gray-800 dark:text-slate-100">Apply Coupon</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">Coupon support coming soon</p>
        </div>
      </div>

      <div className="space-y-4 text-gray-700 dark:text-slate-300">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>Calculated by Shopify</span>
        </div>

        <div className="border-t border-gray-100 dark:border-white/10 pt-4 flex justify-between text-xl font-bold text-gray-900 dark:text-slate-100">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>


      <button
        type="button"
        onClick={handleOrderNow}
        className="w-full mt-6 bg-black hover:bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        Order Now →
        <ArrowRight size={18} />
      </button>

      <button
        type="button"
        onClick={() => navigate("/products")}
        className="w-full mt-4 border-2 border-black text-black hover:bg-black hover:text-white py-4 rounded-2xl font-semibold transition-all duration-300"
      >
        Continue Shopping
      </button>
    </div>
  );
}
