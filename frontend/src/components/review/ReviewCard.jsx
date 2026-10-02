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
        h-[166px]
        w-full
        shrink-0
        flex-col
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-white
        p-2.5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-pink-300
        hover:shadow-lg
        dark:border-[#292929]
        dark:bg-[#111111]
        dark:hover:border-pink-500
        sm:h-[166px]
        sm:w-full
        lg:h-[260px]
        lg:w-[320px]
        sm:p-5
      "
    >
      {/* Top */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Product image */}
          <div
            className="
              flex
              h-8
              w-8
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
              sm:h-12
              sm:w-12
            "
          >
            {productImage ? (
              <img
                src={productImage}
                alt="Product"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[9px] text-gray-400 sm:text-xs">DYVA</span>
            )}
          </div>

          {/* Customer */}
          <div className="min-w-0">
            <h3 className="truncate text-[11px] font-semibold text-gray-900 dark:text-white sm:text-sm">
              {customerName}
            </h3>

            {date && (
              <p className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-400 sm:text-xs">
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
              size={10}
              className={`sm:h-3.5 sm:w-3.5 ${
                star <= rating
                  ? "fill-pink-500 text-pink-500"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Review title */}
      {review?.title && (
        <h4 className="mt-2 line-clamp-1 text-xs font-semibold text-gray-900 dark:text-white sm:mt-4 sm:text-sm">
          {review.title}
        </h4>
      )}

      {/* Review body */}
      <p
        className="
          mt-2
          line-clamp-2
          flex-1
          overflow-hidden
          text-[10px]
          leading-4
          text-gray-600
          dark:text-gray-300
          sm:mt-3
          sm:line-clamp-5
          sm:text-sm
          sm:leading-6
        "
      >
        {reviewText}
      </p>

      {/* Bottom */}
      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-1.5 dark:border-[#292929] sm:mt-4 sm:pt-3">
        <span className="text-[9px] font-medium text-pink-500 sm:text-xs">
          Verified Customer
        </span>

        <span className="text-[9px] text-gray-400 sm:text-xs">
          ★ {rating.toFixed(1)}
        </span>
      </div>
    </article>
  );
}
