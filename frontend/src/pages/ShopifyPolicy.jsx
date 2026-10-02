import React, { useEffect, useState } from 'react';
import api from '../services/api';

const toSafeHtml = (html) => {
  const parsed = new DOMParser().parseFromString(html || '', 'text/html');
  parsed.querySelectorAll('script, style, iframe, object, embed, form').forEach((node) => node.remove());
  parsed.body.querySelectorAll('*').forEach((node) => [...node.attributes].forEach((attribute) => {
    const name = attribute.name.toLowerCase();
    if (name.startsWith('on') || (['href', 'src', 'xlink:href'].includes(name) && /^\s*(javascript|data):/i.test(attribute.value))) node.removeAttribute(attribute.name);
  }));
  return parsed.body.innerHTML;
};

export default function ShopifyPolicy({ kind, heading }) {
  const [policy, setPolicy] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.get(`/shopify/policies/${kind}`).then(({ data }) => { if (active) setPolicy(data?.data?.[0] || null); })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'The policy could not be loaded right now. Please try again later.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind]);
  return <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-charcoal dark:bg-[#080808] dark:text-white sm:px-6 sm:py-16"><div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">DYVA Store Policy</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{policy?.title || heading}</h1>
    {loading && <div role="status" className="mt-8 rounded-3xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-[#111111]">Loading policy from Shopify…</div>}
    {!loading && error && <div role="alert" className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-7 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">{error}</div>}
    {!loading && !error && !policy && <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-[#111111]">This policy has not been published in the Shopify store yet.</div>}
    {!loading && !error && policy && <article className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-[#111111] sm:p-10">{policy.updatedAt && <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">Last updated {new Date(policy.updatedAt).toLocaleDateString()}</p>}<div className="prose prose-sm max-w-none leading-7 text-gray-600 prose-headings:text-gray-950 prose-strong:text-gray-900 prose-a:text-primary dark:prose-invert dark:text-gray-300 dark:prose-headings:text-white dark:prose-strong:text-white" dangerouslySetInnerHTML={{ __html: toSafeHtml(policy.body) }}/>{policy.url && <a href={policy.url} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary-soft dark:border-white/10">View policy on Shopify</a>}</article>}
  </div></main>;
}
