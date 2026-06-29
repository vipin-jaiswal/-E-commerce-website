import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronRight, Truck, CheckCircle, Clock, XCircle } from "lucide-react";
import { orderService } from "../services/orderService";
import PageLoader from "../components/common/Loader";

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-gold bg-gold-light" },
  processing: { label: "Processing", icon: Clock, color: "text-blue-500 bg-blue-50" },
  shipped: { label: "Shipped", icon: Truck, color: "text-accent bg-accent/10" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-sage bg-sage/10" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-red-400 bg-red-50" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-pill ${cfg.color}`}>
      <Icon size={13} /> {cfg.label}
    </span>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService
      .getMine()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-site mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-charcoal mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-ivory-dark flex items-center justify-center mb-6">
            <Package size={32} className="text-muted" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-charcoal mb-3">No orders yet</h2>
          <p className="text-muted mb-8 max-w-xs">Once you place an order, it will show up here.</p>
          <Link to="/products" className="btn-primary inline-flex">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl shadow-card p-5 hover:shadow-hover transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-semibold text-sm text-charcoal">Order #{order.id}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-muted">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {order.items?.length || 0} item(s) · ₹{Number(order.totalPrice ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {order.items?.slice(0, 3).map((item, i) => (
                    <div key={i} className="w-12 h-12 rounded-xl overflow-hidden bg-ivory-dark flex-shrink-0">
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <div className="w-12 h-12 rounded-xl bg-ivory-dark flex items-center justify-center text-xs font-semibold text-muted">
                      +{order.items.length - 3}
                    </div>
                  )}
                  <Link
                    to={`/orders/${order.id}`}
                    className="ml-2 flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-dark transition-colors"
                  >
                    Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {["shipped", "delivered"].includes(order.status) && (
                <div className="mt-5 pt-4 border-t border-border">
                  <div className="flex items-center gap-0">
                    {["Order Placed", "Processing", "Shipped", "Delivered"].map((label, index, arr) => {
                      const stepMap = { pending: 0, processing: 1, shipped: 2, delivered: 3 };
                      const current = stepMap[order.status] ?? 0;
                      const done = index <= current;

                      return (
                        <React.Fragment key={label}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? "bg-sage" : "bg-border"}`}>
                              {done && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className={`text-[10px] font-medium whitespace-nowrap ${done ? "text-sage" : "text-muted"}`}>
                              {label}
                            </span>
                          </div>
                          {index < arr.length - 1 && (
                            <div className={`flex-1 h-px mx-1 mb-4 ${index < current ? "bg-sage" : "bg-border"}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
