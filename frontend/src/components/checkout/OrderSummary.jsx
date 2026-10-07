import React from "react";
import { useCart } from "../../hooks/useCart";
import { formatCurrency } from "../../utils/currency";
import Rating from "../common/Rating";
import { useReviewStats } from "../../context/ReviewStatsContext";

function ItemReviewCount({ item }) {
  const stats = useReviewStats(item.handle || item.productId);
  const count = stats?.count ?? item.reviewCount ?? item.numReviews ?? 0;
  const rating = stats?.rating ?? item.rating ?? 0;
  return <Rating value={rating} count={count} size={11} />;
}

export default function OrderSummary() {
  const { items, cartSubtotal, cartTotal, cartCurrency } = useCart();

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
                <ItemReviewCount item={item} />
                {item.weight && <p className="text-xs text-muted">{item.weight}</p>}
                <p className="text-xs text-muted">Qty: {qty}</p>
              </div>
              <p className="text-xs font-semibold text-charcoal flex-shrink-0">
                {formatCurrency(price * qty, cartCurrency)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm text-muted">
          <span>Products</span>
          <span>{formatCurrency(cartSubtotal, cartCurrency)}</span>
        </div>

        <div className="flex justify-between text-sm text-muted">
          <span>Shipping &amp; taxes</span>
          <span>Shown at checkout</span>
        </div>

        <div className="flex justify-between text-sm font-bold text-charcoal pt-2 border-t border-border">
          <span>Products total</span>
          <span>{formatCurrency(cartTotal, cartCurrency)}</span>
        </div>
      </div>
    </div>
  );
}
