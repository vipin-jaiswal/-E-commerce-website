import React, { useEffect, useMemo, useState } from "react";
import ReviewCard from "./ReviewCard";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ReviewSection({
  productHandle = "",
  onWriteReview,
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizedHandle = String(productHandle || "").trim();

  const reviewsUrl = useMemo(() => {
    const url = new URL(
      `${API_BASE_URL.replace(/\/$/, "")}/api/reviews`
    );

    if (normalizedHandle) {
      url.searchParams.set("productHandle", normalizedHandle);
    }

    return url.toString();
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

    // Fallback: try to find a review form on the page
    const reviewForm = document.getElementById("review-form");

    if (reviewForm) {
      reviewForm.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      const firstInput = reviewForm.querySelector(
        "input, textarea, select"
      );

      if (firstInput) {
        setTimeout(() => firstInput.focus(), 400);
      }
    }
  };

  return (
    <section
      className="
        w-full
        bg-[#fafafa]
        px-6
        py-16
        dark:bg-[#0b0b0b]
      "
    >
      <div className="mx-auto max-w-[1280px]">
        {/* Header */}
        <div
          className="
            flex
            flex-col
            gap-6
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
                mt-3
                text-3xl
                font-bold
                tracking-tight
                text-gray-950
                sm:text-4xl
                dark:text-white
              "
            >
              What our customers say
            </h2>

            <p
              className="
                mt-3
                text-base
                text-gray-500
                dark:text-gray-400
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
              px-7
              py-3
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
            mt-10
            min-h-[150px]
            overflow-hidden
            rounded-2xl
            border
            border-dashed
            border-gray-200
            bg-white
            p-6
            dark:border-[#292929]
            dark:bg-[#111111]
          "
        >
          {/* Loading */}
          {loading && (
            <div className="flex min-h-[130px] items-center justify-center">
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
            <div className="flex min-h-[130px] flex-col items-center justify-center text-center">
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
            <div className="flex min-h-[130px] items-center justify-center text-center">
              <p className="text-base text-gray-500 dark:text-gray-400">
                No reviews yet. Be the first to share your experience.
              </p>
            </div>
          )}

          {/* Review cards */}
          {!loading && !error && reviews.length > 0 && (
            <div
              className="
                flex
                gap-5
                overflow-x-auto
                pb-3
                scrollbar-thin
                scrollbar-thumb-gray-300
                dark:scrollbar-thumb-gray-700
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
    </section>
  );
}