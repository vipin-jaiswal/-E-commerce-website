import React from "react";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/currency";

export default function OrderSummary({ discount = 0 }) {
  const { items, cartTotal } = useCart();
  const discountAmount = Math.round(cartTotal * discount);
  const total = cartTotal - discountAmount;

  return (
    <div className="ui-card p-6 sticky top-24">
      <h3 className="font-display text-xl font-semibold text-charcoal mb-5">
        Order Summary
      </h3>

      <div className="space-y-3 mb-5 max-h-64 overflow-y-auto no-scrollbar">
        {items.map((item) => {
          const qty = Number(item.quantity ?? item.qty ?? 1) || 1;
          const price = Number(item.salePrice ?? item.price ?? 0);

          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-ivory-dark flex-shrink-0">
                <img
                  src={item.images?.[0] || "/placeholder.jpg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-charcoal line-clamp-1">
                  {item.name}
                </p>
                {item.weight && <p className="text-xs text-muted">{item.weight}</p>}
                <p className="text-xs text-muted">Qty: {qty}</p>
              </div>
              <p className="text-xs font-semibold text-charcoal flex-shrink-0">
                {formatCurrency(price * qty)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm text-muted">
          <span>Subtotal</span>
          <span>{formatCurrency(cartTotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>Discount</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-muted">
          <span>Shipping</span>
          <span>Calculated by Shopify</span>
        </div>

        <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-border">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
