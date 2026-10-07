export function getCustomerOrderStatus(order = {}) {
  const rawOrderStatus = String(order.status || order.orderStatus || "").toUpperCase();
  if (
    order.cancelledAt ||
    order.canceledAt ||
    rawOrderStatus === "CANCELLED" ||
    rawOrderStatus === "CANCELED"
  ) return "Cancelled";

  const fulfillmentStatus = String(order.fulfillmentStatus || "").toUpperCase();
  const paymentStatus = String(
    order.paymentStatus ?? order.financialStatus ?? ""
  ).toUpperCase();

  if (fulfillmentStatus.includes("OUT_FOR_DELIVERY")) return "Out for Delivery";
  if (fulfillmentStatus.includes("DELIVER")) return "Delivered";
  if (fulfillmentStatus === "FULFILLED") return "Shipped";
  if (fulfillmentStatus === "PARTIALLY_FULFILLED" || fulfillmentStatus.includes("IN_PROGRESS")) return "Processing";
  if (fulfillmentStatus === "UNFULFILLED" && paymentStatus === "PENDING") return "Order Placed";
  return order.fulfillmentStatus || "Processing";
}

export function getCustomerPaymentStatus(order = {}) {
  const paymentStatus = String(
    order.paymentStatus ?? order.financialStatus ?? ""
  ).toUpperCase();
  const rawOrderStatus = String(order.status || order.orderStatus || "").toUpperCase();
  const isCancelled = Boolean(order.cancelledAt || order.canceledAt) ||
    rawOrderStatus === "CANCELLED" || rawOrderStatus === "CANCELED";

  if (getCustomerPaymentMethod(order) === "Cash on Delivery (COD)") {
    return isCancelled ? "Not Paid" : "To be paid on delivery";
  }
  if (isCancelled && paymentStatus === "VOIDED") return "Not Paid";
  if (paymentStatus === "PAID") return "Paid";
  if (paymentStatus === "PENDING") return "Pending";
  return order.paymentStatus ?? order.financialStatus ?? "Pending";
}

export function getCustomerOrderTotal(order = {}) {
  const isCancelled = getCustomerOrderStatus(order) === "Cancelled";
  if (isCancelled) {
    return order.originalAmount || order.originalTotalPrice || order.amount || order.currentTotalPrice || null;
  }
  return order.amount || order.currentTotalPrice || order.originalAmount || null;
}

export function getCustomerPaymentMethod(order = {}) {
  const rawMethod = order.paymentMethod || order.gateway || order.paymentGateway || "";
  const gatewayNames = Array.isArray(order.paymentGatewayNames)
    ? order.paymentGatewayNames
    : [];
  const methods = [rawMethod, ...gatewayNames].map((method) => String(method).trim());
  const normalized = methods.map((method) => method.toLowerCase());

  if (normalized.some((method) =>
    method.includes("cod") ||
    method.includes("cash on delivery") ||
    method === "manual" ||
    method.includes("manual")
  )) {
    return "Cash on Delivery (COD)";
  }

  return methods.find(Boolean) || "Unknown";
}
