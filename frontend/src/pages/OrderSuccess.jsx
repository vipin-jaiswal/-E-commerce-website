import React from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { formatCurrency } from "../utils/currency";
import { getCustomerOrderStatus, getCustomerPaymentMethod } from "../utils/orderStatus";

const addressLine = (address) =>
  [address?.address1, address?.address2, address?.city, address?.province, address?.zip, address?.country]
    .filter(Boolean)
    .join(", ");

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const routeOrderId = searchParams.get("orderId");
  let order = null;
  try {
    order = JSON.parse(sessionStorage.getItem("dyvaCodOrder") || "null");
  } catch {
    order = null;
  }
  if (!order?.success || !order?.id || !order?.orderId || (routeOrderId && routeOrderId !== String(order.orderId))) {
    return <Navigate to="/cart" replace />;
  }

  const amount = order.amount;
  const amountText = amount?.amount != null
    ? formatCurrency(amount.amount, amount.currencyCode || "INR")
    : "Amount unavailable";
  const items = order.lineItems?.nodes || [];
  const customerOrderStatus = getCustomerOrderStatus(order);
  const paymentMethod = getCustomerPaymentMethod(order);

  return (
    <div className="min-h-screen bg-white px-4 py-12 dark:bg-[#090909]">
      <section className="mx-auto max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#111111]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">DYVA</p>
        <h1 className="mt-4 text-3xl font-bold dark:text-white">Order Confirmed!</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Your Cash on Delivery order has been placed.</p>
        <dl className="mt-8 grid gap-5 border-y border-gray-100 py-6 text-sm dark:border-white/10 sm:grid-cols-2">
          <div><dt className="text-gray-500">Order ID</dt><dd className="mt-1 font-semibold dark:text-white">{order.orderId}</dd></div>
          <div><dt className="text-gray-500">Total amount</dt><dd className="mt-1 font-semibold dark:text-white">{amountText}</dd></div>
          <div><dt className="text-gray-500">Payment</dt><dd className="mt-1 font-semibold dark:text-white">{paymentMethod}</dd></div>
          <div><dt className="text-gray-500">Status</dt><dd className="mt-1 font-semibold dark:text-white">{customerOrderStatus}</dd></div>
        </dl>
        <div className="mt-6">
          <h2 className="font-semibold dark:text-white">Products</h2>
          {items.length ? (
            <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              {items.map((item, index) => (
                <li key={`${item.title}-${index}`} className="flex justify-between gap-4">
                  <span>{item.title}</span><span>x {item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-gray-500">Product details unavailable.</p>}
        </div>
        <div className="mt-6">
          <h2 className="font-semibold dark:text-white">Shipping address</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{addressLine(order.shippingAddress) || "Address unavailable"}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`/order-details?orderId=${encodeURIComponent(order.orderId)}`} className="ui-primary rounded-xl px-5 py-3 text-sm font-semibold">View Order Summary</Link>
          <Link to="/orders" className="rounded-xl border px-5 py-3 text-sm font-semibold dark:border-white/20 dark:text-white">View My Orders</Link>
          <Link to="/products" className="rounded-xl border px-5 py-3 text-sm font-semibold dark:border-white/20 dark:text-white">Continue Shopping</Link>
        </div>
      </section>
    </div>
  );
}
