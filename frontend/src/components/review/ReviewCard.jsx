import React from "react";
import { Star } from "lucide-react";

export default function ReviewCard({ review }) {
  const rating = Math.min(5, Math.max(0, Number(review?.rating) || 0));

  const productImage =
    review?.productImage ||
    review?.product?.image ||
    review?.image ||
    "";

  const customerName =
    review?.customerName ||
    review?.author ||
    "Customer";

  const reviewText =
    review?.text ||
    review?.body ||
    "";

  const date = review?.date
    ? new Date(review.date).toLocaleDateString()
    : "";

  return (
    <article
      className="
        group
        flex
        h-[260px]
        w-[320px]
        shrink-0
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-pink-300
        hover:shadow-lg
        dark:border-[#292929]
        dark:bg-[#111111]
        dark:hover:border-pink-500
      "
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Product image */}
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-xl
              border
              border-gray-200
              bg-gray-50
              dark:border-[#333]
              dark:bg-[#181818]
            "
          >
            {productImage ? (
              <img
                src={productImage}
                alt="Product"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-xs text-gray-400">DYVA</span>
            )}
          </div>

          {/* Customer */}
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {customerName}
            </h3>

            {date && (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {date}
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="flex shrink-0 gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={
                star <= rating
                  ? "fill-pink-500 text-pink-500"
                  : "text-gray-300 dark:text-gray-600"
              }
            />
          ))}
        </div>
      </div>

      {/* Review title */}
      {review?.title && (
        <h4 className="mt-4 line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
          {review.title}
        </h4>
      )}

      {/* Review body */}
      <p
        className="
          mt-3
          line-clamp-5
          flex-1
          overflow-hidden
          text-sm
          leading-6
          text-gray-600
          dark:text-gray-300
        "
      >
        {reviewText}
      </p>

      {/* Bottom */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-[#292929]">
        <span className="text-xs font-medium text-pink-500">
          Verified Customer
        </span>

        <span className="text-xs text-gray-400">
          ★ {rating.toFixed(1)}
        </span>
      </div>
    </article>
  );
}