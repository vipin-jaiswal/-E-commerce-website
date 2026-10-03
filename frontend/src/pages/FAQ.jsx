import React, { useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const FAQS = [
  { question: 'How can I find the right product for my routine?', answer: 'Explore our product categories and product details to find options that fit your needs. If you need help choosing, contact our support team.' },
  { question: 'How do I track my order?', answer: 'Enter the tracking ID from your shipping confirmation on the Track Order page. No account or email is required.' },
  { question: 'Where can I find shipping and return information?', answer: 'Our current shipping and return policies are loaded directly from the DYVA Shopify store on the Shipping & Returns page.' },
  { question: 'How can I contact DYVA?', answer: 'Use the Contact Us page to prepare a message for our support team.' },
];

export default function FAQ() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(() => FAQS.filter(({ question, answer }) => `${question} ${answer}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16">
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">DYVA Support</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Quick answers to help you shop with confidence.</p>
      <label className="mt-8 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#151515]"><Search size={18} className="text-gray-400"/><input className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400" placeholder="Search questions" value={query} onChange={(event) => { setQuery(event.target.value); setActive(-1); }}/></label>
      <div className="mt-6 space-y-3">{results.map((item, index) => <article key={item.question} className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#111111]"><button className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left font-medium" onClick={() => setActive(active === index ? -1 : index)} aria-expanded={active === index}>{item.question}<ChevronDown size={18} className={`shrink-0 text-primary transition-transform ${active === index ? 'rotate-180' : ''}`}/></button><div className={`grid transition-[grid-template-rows] duration-300 ${active === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-6 text-gray-600 dark:text-gray-400">{item.answer}</p></div></div></article>)}{!results.length && <p className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-white/10">No matching questions. Try another search.</p>}</div>
    </div>
  </main>;
}
