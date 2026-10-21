import React, { useState } from 'react';
import { CheckCircle2, Clock3, Mail, MessageCircle, Send } from 'lucide-react';
import api from '../services/api';

const SUPPORT_EMAIL = 'support@dyva.com';
const INSTAGRAM_URL = 'DYAVA Instagram link coming soon';
const SUBJECT_OPTIONS = [
  'Product enquiry',
  'Order or tracking help',
  'Shipping question',
  'Return or refund request',
  'Payment issue',
  'Account help',
  'Feedback',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', orderNumber: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSent(false);
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    if (!payload.name || !payload.email || !payload.subject || !payload.message) {
      setError('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/contact', payload);
      setSent(true);
      setForm({ name: '', email: '', phone: '', orderNumber: '', subject: '', message: '' });
    } catch {
      setError('Unable to send your message right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const input = 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#151515] dark:text-white';

  return <main className="min-h-screen bg-pink-50/40 px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16">
    <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[.8fr_1.2fr]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-pink-600 dark:text-primary">We’re here to help</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Contact us</h1>
        <p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">Send our team the details of your question and we’ll help you as quickly as possible.</p>
        <div className="mt-6 flex flex-col items-start gap-4">
          <a aria-label={`Email DYVA support at ${SUPPORT_EMAIL}`} title={SUPPORT_EMAIL} className="inline-flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-base font-medium text-gray-700 transition hover:bg-pink-100 hover:text-pink-600 dark:text-gray-300 dark:hover:bg-pink-950/40 dark:hover:text-pink-400" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={28} strokeWidth={1.8} className="shrink-0 text-pink-500"/><span>Email us: {SUPPORT_EMAIL}</span></a>
          <a aria-label="Instagram link will be added later" title="Instagram link coming soon" className="inline-flex min-h-12 cursor-default items-center gap-3 rounded-xl px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300" href={INSTAGRAM_URL} onClick={(event) => event.preventDefault()}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 shrink-0 fill-none stroke-pink-500" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".75" className="fill-pink-500 stroke-none"/></svg><span>Follow us on Instagram</span></a>
        </div>
        <div className="mt-8 space-y-4 border-t border-gray-200 pt-6 dark:border-white/10">
          <div className="flex items-start gap-3"><Clock3 size={19} className="mt-0.5 shrink-0 text-primary"/><div><p className="text-sm font-semibold text-gray-900 dark:text-white">Quick response</p><p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">Our support team usually replies within 1 business day.</p></div></div>
          <div className="flex items-start gap-3"><MessageCircle size={19} className="mt-0.5 shrink-0 text-primary"/><div><p className="text-sm font-semibold text-gray-900 dark:text-white">How we can help</p><p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">Ask us about products, orders, shipping, returns, payments, or your account.</p></div></div>
        </div>
        <div className="mt-8 rounded-2xl border border-pink-100 bg-pink-50 p-5 dark:border-white/10 dark:bg-[#151515]"><p className="text-sm font-semibold text-gray-900 dark:text-white">Before you send</p><ul className="mt-3 space-y-2 text-sm leading-6 text-gray-600 dark:text-gray-400"><li>• Include your order number for order-related questions.</li><li>• Mention the product name or concern if relevant.</li><li>• Describe the issue clearly so we can assist faster.</li></ul></div>
      </div>
      <form onSubmit={submit} className="rounded-3xl border border-pink-100 bg-white p-6 shadow-[0_12px_35px_rgba(236,72,153,0.06)] dark:border-white/10 dark:bg-[#111111] dark:shadow-none sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Name<input className={input} name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={update} placeholder="Your full name"/></label>
          <label className="text-sm font-medium">Email<input className={input} name="email" type="email" autoComplete="email" required maxLength={150} value={form.email} onChange={update} placeholder="you@example.com"/></label>
          <label className="text-sm font-medium">Phone <span className="font-normal text-gray-400">(optional)</span><input className={input} name="phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={update} placeholder="Your phone number"/></label>
          <label className="text-sm font-medium">Shopify Order ID <span className="font-normal text-gray-400">(optional)</span><input className={input} name="orderNumber" maxLength={100} value={form.orderNumber} onChange={update} placeholder="Numeric Shopify order ID"/></label>
          <label className="text-sm font-medium sm:col-span-2">Subject<select className={`${input} appearance-none`} name="subject" required value={form.subject} onChange={update}><option value="">Select a subject</option>{SUBJECT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
        </div>
        <label className="mt-4 block text-sm font-medium">Message<textarea className={`${input} min-h-36 resize-y`} name="message" required maxLength={5000} value={form.message} onChange={update} placeholder="Please include your order number or product name if relevant, along with the details of your question."/><span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">The more details you share, the faster we can help.</span></label>
        {sent && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-400"><CheckCircle2 size={17}/> Message sent successfully. Our team will get back to you soon.</p>}
        {error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button disabled={submitting} className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60" type="submit"><Send size={16}/>{submitting ? 'Sending...' : 'Send message'}</button>
        <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">Your message is sent securely to the DYVA support team.</p>
      </form>
    </div>
  </main>;
}
