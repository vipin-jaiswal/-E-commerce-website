import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, PackageCheck } from 'lucide-react';
import api from '../services/api';

const pretty = (value) => String(value || 'Not available').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState(''); const [email, setEmail] = useState('');
  const [order, setOrder] = useState(null); const [status, setStatus] = useState('idle'); const [error, setError] = useState('');
  const submit = async (event) => {
    event.preventDefault(); setOrder(null); setError('');
    if (!localStorage.getItem('token')) { setStatus('error'); setError('Please sign in with the email used for your order to securely view your order history.'); return; }
    setStatus('loading');
    try {
      const { data } = await api.get('/auth/me'); const customer = data?.data?.customer;
      if (!customer || customer.email?.toLowerCase() !== email.trim().toLowerCase()) throw new Error('The email must match the signed-in customer account.');
      const match = (customer.orders?.nodes || []).find((item) => String(item.orderNumber) === orderNumber.trim().replace(/^#/, ''));
      if (!match) throw new Error('We could not find that order in your 20 most recent orders. Check the order number or sign in to the correct account.');
      setOrder(match); setStatus('success');
    } catch (requestError) { setError(requestError.message || requestError.response?.data?.message || 'Order details could not be loaded. Please try again.'); setStatus('error'); }
  };
  const total = order?.currentTotalPrice;
  return <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16"><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Order support</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Track your order</h1><p className="mt-4 text-gray-600 dark:text-gray-400">For privacy, order lookup is available to the signed-in customer.</p>
    <form onSubmit={submit} className="mt-8 grid gap-4 rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111] sm:grid-cols-2"><label className="text-sm font-medium">Order number<input className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-[#151515]" required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. 1001"/></label><label className="text-sm font-medium">Order email<input className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-primary dark:border-white/10 dark:bg-[#151515]" required type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></label><button disabled={status === 'loading'} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2" type="submit"><Search size={16}/>{status === 'loading' ? 'Looking up order…' : 'Find order'}</button></form>
    {status === 'error' && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">{error}{!localStorage.getItem('token') && <Link className="ml-1 underline" to={`/login?returnTo=${encodeURIComponent('/track-order')}`}>Sign in</Link>}</div>}
    {status === 'success' && order && <article className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111] sm:p-8"><div className="flex items-center gap-3"><PackageCheck className="text-primary"/><div><h2 className="text-xl font-semibold">Order #{order.orderNumber}</h2><p className="text-sm text-gray-500 dark:text-gray-400">Placed {order.processedAt ? new Date(order.processedAt).toLocaleDateString() : 'date unavailable'}</p></div></div><dl className="mt-6 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-gray-500">Payment</dt><dd className="mt-1 font-medium">{pretty(order.financialStatus)}</dd></div><div><dt className="text-gray-500">Fulfillment</dt><dd className="mt-1 font-medium">{pretty(order.fulfillmentStatus || 'Unfulfilled')}</dd></div><div><dt className="text-gray-500">Order status</dt><dd className="mt-1 font-medium">{pretty(order.fulfillmentStatus || 'Processing')}</dd></div><div><dt className="text-gray-500">Total</dt><dd className="mt-1 font-medium">{total ? `${total.amount} ${total.currencyCode}` : 'Not available'}</dd></div></dl><h3 className="mt-7 border-t border-gray-100 pt-5 font-semibold dark:border-white/10">Items</h3><ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">{(order.lineItems?.nodes || []).map((line, i) => <li key={`${line.title}-${i}`} className="flex justify-between gap-4"><span>{line.title}</span><span>Qty {line.quantity}</span></li>)}</ul><p className="mt-5 text-xs text-gray-500 dark:text-gray-400">Tracking links and shipping details are not included in the order data available through the current customer API.</p></article>}
  </div></main>;
}
