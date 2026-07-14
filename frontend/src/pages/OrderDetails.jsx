import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Package, XCircle, CheckCircle } from "lucide-react";
import PageLoader from "../components/common/Loader";
import { orderService } from "../services/orderService";
import toast from "react-hot-toast";

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

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

  const canCancel = ["ordered", "confirmed"].includes(order.status);
  const cancelOrder = async () => {
    if (!window.confirm(`Cancel order #${order.id}?`)) return;
    setCancelling(true);
    try {
      const cancelled = await orderService.cancel(order.id);
      setOrder(cancelled);
      toast.success("Order cancelled and stock restored");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-10">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted">Order #{order.id}</p>
          <h1 className="font-display text-3xl font-semibold text-charcoal">Order details</h1>
        </div>
        <div className="flex items-center gap-3">
          {canCancel && (
            <button
              type="button"
              onClick={cancelOrder}
              disabled={cancelling}
              className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-60"
            >
              <XCircle size={16} /> {cancelling ? "Cancelling..." : "Cancel order"}
            </button>
          )}
          <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-dark">
            <ArrowLeft size={16} />
            Back
          </Link>
        </div>
      </div>

      <div className={`mb-6 rounded-2xl px-4 py-3 text-sm font-semibold ${order.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
        Order status: {String(order.status || 'ordered').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())}
      </div>

      {order.status !== 'cancelled' && (
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 font-semibold text-charcoal">Track order</h2>
          <div className="flex items-start gap-0">
            {['Ordered', 'Confirmed', 'Dispatched', 'Out for delivery', 'Delivered'].map((label, index, steps) => {
              const current = { pending: 0, ordered: 0, confirmed: 1, dispatched: 2, out_for_delivery: 3, delivered: 4 }[order.status] ?? 0;
              const done = index <= current;
              return (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                      {done && <CheckCircle size={15} className="text-white" />}
                    </div>
                    <span className={`text-xs font-medium ${done ? 'text-emerald-700' : 'text-slate-400'}`}>{label}</span>
                  </div>
                  {index < steps.length - 1 && <div className={`mt-3 h-0.5 flex-1 ${index < current ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

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
                    <p className="text-sm text-muted">
                      Qty: {item.quantity} · ₹{Number(item.price ?? 0).toLocaleString("en-IN")} each
                    </p>
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
              <span className="font-semibold text-charcoal">{order.shippingAddress?.name}</span>
              <br />
              Phone: {order.shippingAddress?.phone}
              <br />
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
            <p className="text-sm text-muted mt-2">
              Delivery region: <span className="text-charcoal font-medium capitalize">{String(order.deliveryRegion || 'Not available').replace('-', ' ')}</span>
            </p>
            <p className="text-sm text-muted mt-2">
              Payment status: <span className="text-charcoal font-medium capitalize">
                {order.paymentMethod === 'cod' && ['pending', 'unpaid'].includes(order.paymentStatus)
                  ? 'To be paid on delivery'
                  : order.paymentStatus === 'unpaid'
                    ? 'Unpaid'
                    : (order.paymentStatus || 'pending')}
              </span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
