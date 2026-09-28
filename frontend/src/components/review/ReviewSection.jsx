import React from "react";
import Rating from "../common/Rating";

export default function ReviewSection({ reviews = [] }) {
  return (
    <section className="mt-16 border-t border-border pt-12 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-charcoal dark:text-slate-100">Customer Reviews</h2>
      {!reviews.length ? (
        <p className="mt-4 text-sm text-muted dark:text-slate-400">No reviews available yet.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((review, index) => (
            <article key={review.id || index} className="rounded-2xl border border-border bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center justify-between gap-3"><strong className="text-sm text-charcoal dark:text-slate-100">{review.customerName || review.author || "Customer"}</strong><Rating value={Number(review.rating) || 0} size={14} /></div>
              <p className="mt-3 text-sm leading-6 text-muted dark:text-slate-300">{review.text || review.body}</p>
              {review.date && <time className="mt-3 block text-xs text-muted dark:text-slate-400">{new Date(review.date).toLocaleDateString()}</time>}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
