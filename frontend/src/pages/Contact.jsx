import React, { useState } from 'react';
import { CheckCircle2, Mail, Send } from 'lucide-react';

const SUPPORT_EMAIL = 'support@dyva.com';
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = (event) => {
    event.preventDefault(); setError(''); setSent(false);
    const body = [`Name: ${form.name}`, `Email: ${form.email}`, `Phone: ${form.phone || 'Not provided'}`, '', form.message].join('\n');
    try {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(body)}`;
      setSent(true);
    } catch { setError('Your email app could not be opened. Please email support@dyva.com directly.'); }
  };
  const input = 'mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-charcoal outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#151515] dark:text-white';
  return <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16"><div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[.8fr_1.2fr]">
    <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">We’re here to help</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Contact us</h1><p className="mt-4 leading-7 text-gray-600 dark:text-gray-400">Send our team a message and we’ll help with your question.</p><a className="mt-6 inline-flex items-center gap-3 text-sm text-gray-600 hover:text-primary dark:text-gray-300" href={`mailto:${SUPPORT_EMAIL}`}><Mail size={18}/>{SUPPORT_EMAIL}</a></div>
    <form onSubmit={submit} className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111] sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Name<input className={input} name="name" autoComplete="name" required value={form.name} onChange={update}/></label><label className="text-sm font-medium">Email<input className={input} name="email" type="email" autoComplete="email" required value={form.email} onChange={update}/></label><label className="text-sm font-medium">Phone <span className="font-normal text-gray-400">(optional)</span><input className={input} name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={update}/></label><label className="text-sm font-medium">Subject<input className={input} name="subject" required value={form.subject} onChange={update}/></label></div><label className="mt-4 block text-sm font-medium">Message<textarea className={`${input} min-h-36 resize-y`} name="message" required minLength={10} value={form.message} onChange={update}/></label>{sent && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-green-700 dark:text-green-400"><CheckCircle2 size={17}/> Your email app should open with your message ready to send.</p>}{error && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}<button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark" type="submit"><Send size={16}/> Prepare message</button><p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">Your message is sent through your email app. No message data is stored on this website.</p></form>
  </div></main>;
}
