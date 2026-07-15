import React from "react";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export default function CartItem({ item }) {
  const { updateQty, removeFromCart } = useCart();

  const productId = item.productId || item.id;
  const cartItemId = item.cartItemId || item.id;
  const name = item.name || "Product";
  const brand = item.brand || "";
  const images = Array.isArray(item.images) ? item.images : [];
  const price = Number(item.salePrice ?? item.price ?? 0);
  const qty = Number(item.quantity ?? item.qty ?? 1) || 1;

  return (
    <div className="flex gap-4 py-5 border-b border-border dark:border-white/10 last:border-0 transition-colors duration-300">
      <Link to={`/products/${productId}`} className="flex-shrink-0">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-ivory-dark dark:bg-slate-800">
          <img
            src={images[0] || "/placeholder.jpg"}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        {brand && (
          <p className="text-[11px] text-muted dark:text-slate-400 font-medium tracking-widest uppercase mb-0.5">
            {brand}
          </p>
        )}

        <Link to={`/products/${productId}`}>
          <h3 className="text-sm font-semibold text-charcoal dark:text-slate-100 hover:text-accent transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>

        {item.weight && <p className="mt-1 text-xs text-muted dark:text-slate-400">Weight: {item.weight}</p>}

        <p className="text-sm font-semibold text-charcoal dark:text-slate-100 mt-1">
          ₹{price.toLocaleString("en-IN")}
        </p>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center border border-border dark:border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => updateQty(cartItemId, qty - 1)}
              className="w-8 h-8 flex items-center justify-center text-charcoal dark:text-slate-200 hover:bg-ivory-dark dark:hover:bg-slate-800 transition-colors"
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-medium text-charcoal dark:text-slate-100">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => updateQty(cartItemId, qty + 1)}
              className="w-8 h-8 flex items-center justify-center text-charcoal dark:text-slate-200 hover:bg-ivory-dark dark:hover:bg-slate-800 transition-colors"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={() => removeFromCart(cartItemId)}
            className="text-muted dark:text-slate-400 hover:text-red-400 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-charcoal dark:text-slate-100">
          ₹{(price * qty).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}
