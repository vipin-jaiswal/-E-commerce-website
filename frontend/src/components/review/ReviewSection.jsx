import React, { useEffect, useMemo, useState } from "react";
import { Star, X } from "lucide-react";
import ReviewCard from "./ReviewCard";
import { API_BASE } from "../../utils/constants";

export default function ReviewSection({
  productHandle = "",
  onWriteReview,
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    productHandle: productHandle || "",
    author: "",
    rating: 5,
    title: "",
    body: "",
  });

  const normalizedHandle = String(productHandle || "").trim();

  const reviewsUrl = useMemo(() => {
    const url = new URL(`${API_BASE}/reviews`, window.location.origin);

    if (normalizedHandle) {
      url.searchParams.set("productHandle", normalizedHandle);
    }

    return url.toString();
  }, [normalizedHandle]);

  useEffect(() => {
    setForm((current) => ({ ...current, productHandle: normalizedHandle }));
  }, [normalizedHandle]);

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(reviewsUrl);

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message || "Unable to load reviews."
          );
        }

        if (!payload?.success) {
          throw new Error(
            payload?.message || "Unable to load reviews."
          );
        }

        const reviewList = Array.isArray(payload.data)
          ? payload.data
          : [];

        if (!cancelled) {
          setReviews(reviewList);
        }
      } catch (err) {
        console.error("Review loading error:", err);

        if (!cancelled) {
          setReviews([]);
          setError("Unable to load reviews right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [reviewsUrl]);

  const handleWriteReview = () => {
    if (typeof onWriteReview === "function") {
      onWriteReview();
      return;
    }

    setSubmitError("");
    setIsFormOpen(true);
  };

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productHandle: form.productHandle.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to submit your review right now.");
      }

      setReviews((current) => [payload.data, ...current]);
      setForm({ productHandle: normalizedHandle, author: "", rating: 5, title: "", body: "" });
      setIsFormOpen(false);
    } catch (err) {
      setSubmitError(err.message || "Unable to submit your review right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="
        w-full
        bg-[#fafafa]
        px-3
        py-7
        sm:px-6
        sm:py-16
        dark:bg-[#0b0b0b]
      "
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <div
          className="
            flex
            flex-col
            gap-4
            sm:gap-6
            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.28em]
                text-pink-500
              "
            >
              Customer Love
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                tracking-tight
                text-gray-950
                sm:mt-3
                sm:text-4xl
                dark:text-white
              "
            >
              What our customers say
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-gray-500
                dark:text-gray-400
                sm:mt-3
                sm:text-base
              "
            >
              Real experiences from the DYVA community.
            </p>
          </div>

          {/* Write review */}
          <button
            type="button"
            onClick={handleWriteReview}
            className="
              w-fit
              rounded-full
              border
              border-pink-500
              px-5
              py-2.5
              text-sm
              font-medium
              text-pink-500
              transition-all
              duration-300
              hover:bg-pink-500
              hover:text-white
              focus:outline-none
              focus:ring-2
              focus:ring-pink-300
              dark:hover:bg-pink-500
            "
          >
            Write a review
          </button>
        </div>

        {/* Reviews */}
        <div
          className="
            mt-5
            min-h-[120px]
            overflow-hidden
            rounded-2xl
            border
            border-dashed
            border-gray-200
            bg-white
            p-2
            dark:border-[#292929]
            dark:bg-[#111111]
            sm:mt-10
            sm:min-h-[150px]
            sm:p-6
          "
        >
          {/* Loading */}
          {loading && (
            <div className="flex min-h-[120px] items-center justify-center sm:min-h-[130px]">
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span
                  className="
                    h-5
                    w-5
                    animate-spin
                    rounded-full
                    border-2
                    border-gray-200
                    border-t-pink-500
                  "
                />
                Loading reviews...
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex min-h-[120px] flex-col items-center justify-center text-center sm:min-h-[130px]">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="
                  mt-3
                  text-sm
                  font-medium
                  text-pink-500
                  hover:underline
                "
              >
                Try again
              </button>
            </div>
          )}

          {/* No reviews */}
          {!loading && !error && reviews.length === 0 && (
            <div className="flex min-h-[120px] items-center justify-center text-center sm:min-h-[130px]">
              <p className="text-base text-gray-500 dark:text-gray-400">
                No reviews yet. Be the first to share your experience.
              </p>
            </div>
          )}

          {/* Review cards */}
          {!loading && !error && reviews.length > 0 && (
            <div
              className="
                grid
                max-h-[360px]
                grid-cols-2
                gap-2
                overflow-y-auto
                pb-1
                scrollbar-thin
                scrollbar-thumb-gray-300
                dark:scrollbar-thumb-gray-700
                sm:flex
                sm:max-h-none
                sm:gap-5
                sm:overflow-x-auto
                sm:overflow-y-hidden
                sm:pb-3
              "
            >
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    ...review,

                    // ReviewCard supports these names
                    customerName:
                      review.customerName ||
                      review.author ||
                      "Customer",

                    text:
                      review.text ||
                      review.body ||
                      "",

                    date: review.date || "",

                    rating:
                      Number(review.rating) || 0,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsFormOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-review-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#151515] sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 id="write-review-title" className="text-2xl font-semibold text-gray-950 dark:text-white">Write a review</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tell us about your experience.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close review form" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {!normalizedHandle && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Product handle
                  <input
                    required
                    pattern="[A-Za-z0-9][A-Za-z0-9-]{0,254}"
                    value={form.productHandle}
                    onChange={(event) => setForm({ ...form, productHandle: event.target.value })}
                    placeholder="product-name"
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 font-normal outline-none focus:border-pink-500 dark:border-gray-700"
                  />
                </label>
              )}

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Your name
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.author}
                  onChange={(event) => setForm({ ...form, author: event.target.value })}
                  autoComplete="name"
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 font-normal outline-none focus:border-pink-500 dark:border-gray-700"
                />
              </label>

              <fieldset>
                <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">Your rating</legend>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" onClick={() => setForm({ ...form, rating })} aria-label={`${rating} star${rating === 1 ? "" : "s"}`} aria-pressed={form.rating === rating} className="rounded p-1 text-pink-500">
                      <Star size={25} fill={rating <= form.rating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Review title
                <input
                  required
                  maxLength={120}
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-transparent px-4 py-3 font-normal outline-none focus:border-pink-500 dark:border-gray-700"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Your review
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  value={form.body}
                  onChange={(event) => setForm({ ...form, body: event.target.value })}
                  className="mt-1 w-full resize-y rounded-xl border border-gray-300 bg-transparent px-4 py-3 font-normal outline-none focus:border-pink-500 dark:border-gray-700"
                />
              </label>

              {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-full bg-pink-600 px-6 py-3 font-medium text-white transition hover:bg-pink-700 disabled:cursor-wait disabled:opacity-60">
                {isSubmitting ? "Submitting…" : "Submit review"}
              </button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
