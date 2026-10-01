import React, { useEffect, useState } from 'react';
import api from '../services/api';

const toSafeHtml = (html) => {
  const documentNode = new DOMParser().parseFromString(html || '', 'text/html');

  documentNode
    .querySelectorAll('script, style, iframe, object, embed, form')
    .forEach((node) => node.remove());

  documentNode.body.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();

      if (
        name.startsWith('on') ||
        (
          ['href', 'src', 'xlink:href'].includes(name) &&
          /^\s*javascript:/i.test(attribute.value)
        )
      ) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  return documentNode.body.innerHTML;
};

const policyIcon = (type) => {
  if (type === 'SHIPPING_POLICY') return '🚚';
  if (type === 'REFUND_POLICY') return '↩️';
  return '📋';
};

export default function ShippingReturns() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api
      .get('/shopify/policies/shipping-returns')
      .then(({ data }) => {
        if (active) {
          setPolicies(Array.isArray(data?.data) ? data.data : []);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              'Store policies could not be loaded right now. Please try again later.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#171717] transition-colors dark:bg-[#080808] dark:text-white">

      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-pink-500/10 blur-[120px] dark:bg-pink-500/10" />
        <div className="absolute -right-32 top-[40%] h-96 w-96 rounded-full bg-fuchsia-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Home</span>
          <span>›</span>
          <span className="font-medium text-pink-500">
            Shipping & Returns
          </span>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-white px-6 py-10 shadow-sm dark:border-white/10 dark:bg-[#111111] sm:px-10 lg:px-14 lg:py-14">

          {/* Pink Glow */}
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-pink-500/10 blur-[90px]" />
          <div className="absolute -bottom-24 left-20 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[90px]" />

          <div className="relative max-w-3xl">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-pink-600 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-400">
              DYVA Support
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-5xl lg:text-6xl">
              Shipping
              <span className="text-pink-500"> & </span>
              Returns
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-400 sm:text-lg">
              Everything you need to know about shipping, returns and refunds
              for your DYVA orders.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#shipping"
                className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pink-500 dark:bg-white dark:text-black dark:hover:bg-pink-500 dark:hover:text-white"
              >
                Shipping Policy
              </a>

              <a
                href="#returns"
                className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:border-pink-500 hover:text-pink-500 dark:border-white/15 dark:bg-white/5 dark:text-white"
              >
                Return Policy
              </a>
            </div>
          </div>
        </section>

        {/* Quick Info */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#111111]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-xl">
              🚚
            </div>
            <h3 className="font-semibold">Shipping</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Information about delivery and shipping.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#111111]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-xl">
              ↩️
            </div>
            <h3 className="font-semibold">Returns</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Learn about our return process.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#111111]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-xl">
              💳
            </div>
            <h3 className="font-semibold">Refunds</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Details about refund processing.
            </p>
          </div>

        </section>

        {/* Content */}
        <section className="mt-10">

          {loading && (
            <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center dark:border-white/10 dark:bg-[#111111]">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500 dark:border-white/10 dark:border-t-pink-500" />

              <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">
                Loading store policies...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-500/20 dark:bg-red-500/5">
              <div className="text-3xl">⚠️</div>

              <h2 className="mt-3 text-lg font-semibold text-red-700 dark:text-red-400">
                Unable to load policies
              </h2>

              <p className="mt-2 text-sm text-red-600/80 dark:text-red-400/70">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && policies.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-white/10 dark:bg-[#111111]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10 text-2xl">
                📋
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                Policies coming soon
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
                Shipping and return policies have not been added to the
                Shopify store yet.
              </p>
            </div>
          )}

          {/* Policy Cards */}
          {!loading && !error && policies.length > 0 && (
            <div className="space-y-6">

              {policies.map((policy, index) => {
                const isShipping =
                  policy.type === 'SHIPPING_POLICY';

                return (
                  <article
                    key={policy.type}
                    id={isShipping ? 'shipping' : 'returns'}
                    className="group overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm transition hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/5 dark:border-white/10 dark:bg-[#111111] dark:hover:border-pink-500/30"
                  >

                    {/* Card Header */}
                    <div className="flex flex-col gap-5 border-b border-gray-100 p-6 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-8">

                      <div className="flex items-center gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500/10 text-2xl transition group-hover:scale-105">
                          {policyIcon(policy.type)}
                        </div>

                        <div>
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500">
                            Policy {String(index + 1).padStart(2, '0')}
                          </span>

                          <h2 className="mt-1 text-xl font-bold text-gray-950 dark:text-white sm:text-2xl">
                            {policy.title ||
                              (isShipping
                                ? 'Shipping Policy'
                                : 'Return & Refund Policy')}
                          </h2>
                        </div>

                      </div>

                      <span className="w-fit rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600 dark:bg-white/5 dark:text-gray-400">
                        DYVA Store
                      </span>

                    </div>

                    {/* Policy Body */}
                    <div className="p-6 sm:p-8 lg:p-10">

                      <div
                        className="
                          prose
                          prose-sm
                          max-w-none
                          leading-7
                          text-gray-600
                          prose-headings:text-gray-950
                          prose-headings:font-bold
                          prose-strong:text-gray-900
                          prose-a:text-pink-500
                          prose-li:marker:text-pink-500
                          dark:text-gray-300
                          dark:prose-invert
                          dark:prose-headings:text-white
                          dark:prose-strong:text-white
                        "
                        dangerouslySetInnerHTML={{
                          __html: toSafeHtml(policy.body),
                        }}
                      />

                      {policy.url && (
                        <div className="mt-8 border-t border-gray-100 pt-6 dark:border-white/10">
                          <a
                            href={policy.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pink-600"
                          >
                            View Full Policy
                            <span>↗</span>
                          </a>
                        </div>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* Bottom Help */}
        <section className="mt-10 overflow-hidden rounded-[2rem] border border-pink-500/20 bg-gradient-to-r from-pink-500/10 via-white to-fuchsia-500/10 p-8 dark:from-pink-500/10 dark:via-[#111111] dark:to-fuchsia-500/10 sm:p-10">

          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">

            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-500">
                Need Help?
              </span>

              <h2 className="mt-2 text-2xl font-bold">
                Still have questions?
              </h2>

              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Contact our support team and we'll be happy to help.
              </p>
            </div>

            <a
              href="mailto:support@dyva.com"
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-pink-500 dark:bg-white dark:text-black dark:hover:bg-pink-500 dark:hover:text-white"
            >
              Contact Support
            </a>

          </div>
        </section>

      </div>
    </main>
  );
}
