import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getCustomerOrders } from "../services/customerOrders";
import { formatCurrency } from "../utils/currency";
import { getCustomerOrderStatus, getCustomerPaymentMethod, getCustomerPaymentStatus, getCustomerOrderTotal } from "../utils/orderStatus";

const money = (value) => value ? formatCurrency(value.amount, value.currencyCode || "INR") : "—";

const addressName = (address) => [address?.firstName, address?.lastName].filter(Boolean).join(" ");
const addressLines = (address) => address ? [
  address.address1,
  address.address2,
  [address.city, address.province, address.zip].filter(Boolean).join(", "),
  address.country,
  address.phone,
].filter(Boolean) : [];

const stages = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];
const cancelledStages = ["Order Placed", "Cancelled"];

const isCancelledOrder = (order) => {
  const rawStatus = String(order.status || order.orderStatus || "").toUpperCase();
  return Boolean(order.cancelledAt || order.canceledAt) ||
    rawStatus === "CANCELLED" || rawStatus === "CANCELED";
};

const timelineIndex = (order) => {
  const fulfillment = String(order.fulfillmentStatus || "").toUpperCase();
  const fulfillmentNames = (order.fulfillments || []).map((item) => String(item.status || "").toUpperCase());
  if (fulfillment.includes("OUT_FOR_DELIVERY") || fulfillmentNames.some((status) => status.includes("OUT_FOR_DELIVERY"))) return 3;
  if (fulfillment.includes("DELIVER") || fulfillmentNames.some((status) => status.includes("DELIVER"))) return 4;
  if (fulfillment === "FULFILLED" || fulfillmentNames.includes("SUCCESS")) return 2;
  if ((order.fulfillments || []).some((item) => item.trackingInfo?.some((track) => track.number))) return 2;
  return 0;
};

function AddressCard({ title, address }) {
  return (
    <section className="rounded-2xl border border-gray-200 p-5 dark:border-white/10">
      <h2 className="font-semibold dark:text-white">{title}</h2>
      {address ? <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
        {addressName(address) && <p>{addressName(address)}</p>}
        {addressLines(address).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}
      </div> : <p className="mt-3 text-sm text-gray-500">No {title.toLowerCase()} provided.</p>}
    </section>
  );
}

export default function OrderDetails() {
  const [searchParams] = useSearchParams();
  const orderId = (searchParams.get("orderId") || "")
    .split("?")[0]
    .split("/")
    .pop()
    .replace(/^#/, "");
  const [order, setOrder] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    api.get("/orders/details", { params: { orderId } })
      .then(({ data }) => {
        if (!active) return;
        setOrder(data?.order || null);
        setStatus(data?.success && data?.order ? "success" : "not-found");
      })
      .catch((error) => {
        if (!active) return;
        setStatus(error.response?.status === 404 ? "not-found" : "error");
      });
    api.get("/auth/me")
      .then(async ({ data }) => {
        const customer = data?.data?.customer;
        const customerOrders = await getCustomerOrders(customer);
        if (active) setPreviousOrders(customerOrders);
      })
      .catch(() => {
        if (active) setPreviousOrders([]);
      });
    return () => { active = false; };
  }, [orderId]);

  if (status === "loading") return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-16 text-center text-gray-600 dark:text-gray-300">Loading order details...</main>;
  if (status !== "success" || !order) return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold dark:text-white">{status === "not-found" ? "Order not found" : "Unable to load order details. Please try again."}</h1>
      <Link to="/orders" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 font-semibold text-white">View My Orders</Link>
    </main>
  );

  const cancelled = isCancelledOrder(order) || getCustomerOrderStatus(order) === "Cancelled";
  const paymentStatus = getCustomerPaymentStatus({
    ...order,
    paymentStatus: order.paymentStatus || order.financialStatus,
    gateway: order.gateway,
    ...(cancelled ? { status: "CANCELLED" } : {}),
  });
  const paymentMethod = getCustomerPaymentMethod(order);
  const customerStatus = getCustomerOrderStatus(order);
  const shopifyOrderId = String(order.orderId || order.id || "")
    .split("?")[0]
    .split("/")
    .pop()
    .replace(/^#/, "") || "Unavailable";
  const activeStage = cancelled ? 1 : timelineIndex(order);
  const displayedStages = cancelled ? cancelledStages : stages;
  const orderTotal = getCustomerOrderTotal(order);
  const items = order.lineItems?.nodes || [];
  const orderDate = order.createdAt || order.processedAt;

  return (
    <main className="min-h-screen bg-white px-4 py-8 dark:bg-[#090909] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-3xl border border-gray-200 p-6 dark:border-white/10 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Order details</p>
              <h1 className="mt-2 text-xl font-bold dark:text-white sm:text-3xl">Order ID: {shopifyOrderId}</h1>
              <p className="mt-2 text-sm text-gray-500">{orderDate ? new Date(orderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Order date unavailable"}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">{customerStatus}</span>
          </div>
          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <p className="dark:text-gray-200">Payment: <strong>{paymentMethod}</strong></p>
            <p className="dark:text-gray-200">Payment status: <strong>{paymentStatus}</strong></p>
          </div>
        </header>

        <section className="rounded-3xl border border-gray-200 p-6 dark:border-white/10 sm:p-8">
          <h2 className="text-lg font-semibold dark:text-white">Order status</h2>
          <ol className={`mt-6 grid ${cancelled ? "grid-cols-2 gap-0" : "grid-cols-5 gap-1 sm:gap-4"}`}>
            {displayedStages.map((stage, index) => {
              const complete = index < activeStage || (index === 0 && activeStage === 0);
              const current = index === activeStage && index !== 0;
              return <li key={stage} className={`relative flex min-w-0 flex-col items-center gap-2 text-center text-sm ${cancelled && index === 0 ? "after:absolute after:left-1/2 after:top-3.5 after:h-px after:w-full after:bg-primary" : ""}`}>
                <span className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${cancelled && current ? "border-primary bg-primary text-white" : complete ? "border-primary bg-primary text-white" : current ? "border-primary text-primary" : "border-gray-300 text-gray-400 dark:border-white/20"}`}>{complete ? "✓" : current ? "✕" : "○"}</span>
                <span className={cancelled && current ? "font-medium text-primary" : complete || current ? "font-medium text-primary" : "text-gray-500 dark:text-gray-400"}>{stage}</span>
              </li>;
            })}
          </ol>
        </section>

        <section className="rounded-3xl border border-gray-200 p-6 dark:border-white/10 sm:p-8">
          <h2 className="text-lg font-semibold dark:text-white">Products</h2>
          <div className="mt-5 divide-y divide-gray-100 dark:divide-white/10">
            {items.map((item, index) => <article key={`${item.title}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                {item.image?.url && <img src={item.image.url} alt={item.image.altText || item.title} className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium dark:text-white">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500">Quantity: {item.quantity}</p>
                <p className="mt-1 text-sm text-gray-500">Unit price: {money(item.originalUnitPriceSet?.shopMoney)}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold dark:text-white">{money(item.discountedTotalSet?.shopMoney) !== "—" ? money(item.discountedTotalSet.shopMoney) : money(item.originalUnitPriceSet?.shopMoney)}</p>
            </article>)}
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <section className="min-w-0 rounded-3xl border border-gray-200 p-3 dark:border-white/10 sm:p-6">
            <h2 className="text-lg font-semibold dark:text-white">Payment</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Method</dt><dd className="text-right dark:text-white">{paymentMethod}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Status</dt><dd className="dark:text-white">{paymentStatus}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Subtotal</dt><dd className="dark:text-white">{money(cancelled ? (order.subtotal || order.originalSubtotal) : order.subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-gray-500">Shipping</dt><dd className="dark:text-white">{money(order.shipping || order.totalShippingPrice)}</dd></div>
              {order.discount?.amount && Number(order.discount.amount) > 0 && <div className="flex justify-between gap-3"><dt className="text-gray-500">Discount</dt><dd className="dark:text-white">−{money(order.discount)}</dd></div>}
              <div className="flex justify-between gap-3 border-t border-gray-100 pt-3 font-bold dark:border-white/10"><dt className="dark:text-white">Total</dt><dd className="dark:text-white">{money(orderTotal)}</dd></div>
            </dl>
          </section>
          <div className="min-w-0">
            <AddressCard title="Shipping address" address={order.shippingAddress} />
          </div>
          <section className="min-w-0 rounded-3xl border border-gray-200 p-3 dark:border-white/10 sm:p-6">
            <h2 className="text-lg font-semibold dark:text-white">Order information</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div><dt className="text-gray-500">Order ID</dt><dd className="mt-1 break-all dark:text-white">{shopifyOrderId}</dd></div>
              <div><dt className="text-gray-500">Order date</dt><dd className="mt-1 dark:text-white">{orderDate ? new Date(orderDate).toLocaleString("en-IN") : "Unavailable"}</dd></div>
              <div><dt className="text-gray-500">Order status</dt><dd className="mt-1 dark:text-white">{customerStatus}</dd></div>
            </dl>
          </section>
        </div>

       
        <footer className="flex flex-wrap gap-3">
          <Link to="/products" className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Continue Shopping</Link>
          <Link to="/orders" className="rounded-xl border px-5 py-3 text-sm font-semibold dark:border-white/20 dark:text-white">View My Orders</Link>
        </footer>
      </div>
    </main>
  );
}
