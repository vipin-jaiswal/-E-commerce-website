import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, Sparkles, UsersRound } from 'lucide-react';

const BRAND_CONTENT = {
  intro: 'DYVA brings skincare, haircare and beauty essentials together in one considered place.',
  philosophy: 'We believe a good routine should feel personal, approachable and easy to make your own.',
  offerings: 'Explore products across skin care, hair care, makeup and more, with clear product information to help you choose.',
};
const values = [
  { icon: Sparkles, title: 'Thoughtful discovery', copy: BRAND_CONTENT.philosophy },
  { icon: Heart, title: 'A considered selection', copy: BRAND_CONTENT.offerings },
  { icon: UsersRound, title: 'Here to help', copy: 'We aim to make your experience clear and helpful, from browsing through to delivery.' },
];

export default function About() {
  return <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16"><div className="mx-auto max-w-6xl">
    <section className="rounded-[2rem] border border-gray-200 bg-white px-6 py-12 dark:border-white/10 dark:bg-[#111111] sm:px-12 sm:py-16"><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Our story</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">Beauty that feels like <span className="text-primary">you.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-400">{BRAND_CONTENT.intro}</p><Link to="/products" className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark">Explore products <ArrowRight size={16}/></Link></section>
    <section className="mt-8 grid gap-4 md:grid-cols-3">{values.map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111]"><span className="inline-flex rounded-xl bg-primary-soft p-3 text-primary dark:bg-pink-500/10"><Icon size={20}/></span><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{copy}</p></article>)}</section>
  </div></main>;
}
