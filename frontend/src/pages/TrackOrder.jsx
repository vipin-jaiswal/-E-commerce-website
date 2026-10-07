import React, { useEffect, useState } from 'react';
import { Search, PackageCheck, X } from 'lucide-react';
import api from '../services/api';
import { getCustomerOrderStatus } from '../utils/orderStatus';

const pretty = (value) => String(value || 'Not available').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export default function TrackOrder({ modal = false, onClose }) {
  const [trackingId, setTrackingId] = useState('');
  const [order, setOrder] = useState(null); const [status, setStatus] = useState('idle'); const [error, setError] = useState('');
  useEffect(() => {
    if (!modal) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [modal, onClose]);
  const submit = async (event) => {
    event.preventDefault(); setOrder(null); setError('');
    setStatus('loading');
    try {
      const { data } = await api.get('/shopify/track-order', { params: { trackingId: trackingId.trim() } });
      setOrder(data.data); setStatus('success');
    } catch (requestError) { setError(requestError.response?.data?.message || requestError.message || 'Order details could not be loaded. Please try again.'); setStatus('error'); }
  };
  const total = order?.currentTotalPrice;
  const customerOrderStatus = order ? getCustomerOrderStatus(order) : "";
  const content = <div className="mx-auto max-w-3xl text-center"><div className="relative flex items-start justify-center gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Order support</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Track your order</h1></div>{modal && <button type="button" onClick={onClose} aria-label="Close tracking order" className="absolute right-0 top-0 rounded-full p-2 text-gray-500 transition hover:bg-black/5 hover:text-charcoal dark:hover:bg-white/10 dark:hover:text-white"><X size={20}/></button>}</div><p className="mt-4 text-gray-600 dark:text-gray-400">Enter the tracking ID from your shipping confirmation. No account or email is required.</p>
    <form onSubmit={submit} className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111] sm:flex-row sm:items-end"><label className="w-full flex-1 text-center text-sm font-medium sm:text-left">Order ID or Tracking ID<input className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center outline-none focus:border-primary dark:border-white/10 dark:bg-[#151515]" required value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="e.g. order ID or tracking ID"/></label><button disabled={status === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60" type="submit"><Search size={16}/>{status === 'loading' ? 'Looking up order…' : 'Track order'}</button></form>
    {status === 'error' && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">{error}</div>}
    {status === 'success' && order && <article className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 text-center dark:border-white/10 dark:bg-[#111111] sm:p-8"><div className="flex flex-col items-center gap-3"><PackageCheck className="text-primary"/><div><h2 className="break-all text-xl font-semibold">Order ID: #{order.orderNumber}</h2><p className="text-sm text-gray-500 dark:text-gray-400">Placed {order.processedAt ? new Date(order.processedAt).toLocaleDateString() : 'date unavailable'}</p></div></div><dl className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-gray-500">Order status</dt><dd className="mt-1 font-medium">{customerOrderStatus}</dd></div><div><dt className="text-gray-500">Payment</dt><dd className="mt-1 font-medium">{pretty(order.paymentStatus ?? order.financialStatus)}</dd></div><div className="col-span-2"><dt className="text-gray-500">Total</dt><dd className="mt-1 font-medium">{total ? `${total.amount} ${total.currencyCode}` : 'Not available'}</dd></div></dl><h3 className="mt-7 border-t border-gray-100 pt-5 font-semibold dark:border-white/10">Shipment</h3><ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">{(order.fulfillments || []).flatMap((fulfillment) => fulfillment.trackingInfo || []).map((tracking) => <li key={tracking.number} className="flex flex-col items-center justify-between gap-2 sm:flex-row"><span>{tracking.company || 'Carrier'}: {tracking.number}</span>{tracking.url && <a className="font-semibold text-primary underline" href={tracking.url} target="_blank" rel="noreferrer">View tracking</a>}</li>)}</ul><h3 className="mt-7 border-t border-gray-100 pt-5 font-semibold dark:border-white/10">Items</h3><ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">{(order.lineItems?.nodes || []).map((line, i) => <li key={`${line.title}-${i}`} className="flex justify-between gap-4"><span>{line.title}</span><span>Qty {line.quantity}</span></li>)}</ul></article>}
  </div>;
  if (modal) return <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}><div role="dialog" aria-modal="true" aria-labelledby="track-order-title" className="my-auto max-h-[calc(100dvh-6rem)] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/40 bg-white/85 p-1 text-charcoal shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111111]/85 dark:text-white sm:max-h-[90vh]"><div id="track-order-title">{content}</div></div></div>;
  return <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16">{content}</main>;
}
