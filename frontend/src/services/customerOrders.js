import api from "./api";

export async function getCustomerOrders(customer) {
  const orders = customer?.orders?.nodes || [];
  if (!orders.length) return [];

  const response = await api.get("/orders/ids").catch(() => null);
  const orderIds = response?.data?.ids || {};

  return orders.map((order) => {
    // Storefront customer order IDs may include an access-key query suffix;
    // the Admin API ID map is keyed by the canonical Shopify Order GID.
    const canonicalId = String(order.id || "").split("?")[0];
    const metadata = orderIds[order.id] || orderIds[canonicalId] || {};
    return {
      ...order,
      orderId: metadata.orderId || null,
      cancelledAt: metadata.cancelledAt || null,
      originalAmount: metadata.originalAmount || null,
      originalSubtotal: metadata.subtotal || null,
      subtotal: metadata.subtotal || null,
      shipping: metadata.shipping || null,
      amount: metadata.amount || null,
      paymentStatus: metadata.paymentStatus || order.financialStatus || null,
      fulfillmentStatus: metadata.fulfillmentStatus || order.fulfillmentStatus || null,
      paymentGatewayNames: metadata.paymentGatewayNames || [],
      fulfillments: metadata.fulfillments || [],
    };
  });
}
