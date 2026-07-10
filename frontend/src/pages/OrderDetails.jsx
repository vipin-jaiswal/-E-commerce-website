import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import PageLoader from "../components/common/Loader";
import { orderService } from "../services/orderService";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    orderService
      .getById(id)
      .then((data) => {
        if (alive) setOrder(data);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.response?.data?.message || "Order not found");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <PageLoader />;

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <Package size={40} className="mx-auto mb-4 text-muted" />
        <h1 className="text-2xl font-semibold text-charcoal mb-2">Order not available</h1>
        <p className="text-muted mb-6">{error || "We could not load this order."}</p>
        <Link to="/orders" className="inline-flex items-center gap-2 btn-primary">
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted">Order #{order.id}</p>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Order details</h1>
        </div>
        <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-dark">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-semibold text-charcoal mb-4">Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-ivory-dark flex-shrink-0">
                    <img
                      src={item.image || "/placeholder.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-charcoal line-clamp-1">{item.name}</p>
                    <p className="text-sm text-muted">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-charcoal">
                    ₹{Number(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-semibold text-charcoal mb-4">Summary</h2>
            <div className="space-y-2 text-sm text-muted">
              <div className="flex justify-between">
                <span>Items</span>
                <span>₹{Number(order.itemsPrice ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{Number(order.shippingPrice ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>₹{Number(order.taxPrice ?? 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold text-charcoal">
                <span>Total</span>
                <span>₹{Number(order.totalPrice ?? 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-semibold text-charcoal mb-4">Delivery</h2>
            <p className="text-sm text-muted leading-6">
              {order.shippingAddress?.street}
              <br />
              {order.shippingAddress?.city}, {order.shippingAddress?.state}
              <br />
              {order.shippingAddress?.zip}
              <br />
              {order.shippingAddress?.country}
            </p>
            <p className="text-sm text-muted mt-4">
              Payment method: <span className="text-charcoal font-medium capitalize">{order.paymentMethod}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
