import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import api from "../../services/api";

const normalizeReview = (review) => ({
  ...review,
  id: review.id || review._id,
  product: review.product && typeof review.product === "object" ? review.product : null,
});

export default function ProductReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const loadReviews = async () => {
      setLoading(true);

      try {
        const response = await api.get("/reviews");
        const list = Array.isArray(response.data) ? response.data : response.data?.data || [];

        if (!alive) return;
        setReviews(list.map(normalizeReview));
      } catch {
        if (!alive) return;
        setReviews([]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadReviews();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold dark:text-slate-100">Customer Reviews</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Fetched from MongoDB reviews collection.</p>
        </div>
        <span className="text-sm text-gray-500 dark:text-slate-400">{reviews.length} reviews</span>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm animate-pulse">
              <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
              <div className="h-20 bg-gray-100 dark:bg-slate-700 rounded mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => {
            const product = review.product || {};

            return (
              <article key={review.id} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-200">{review.userName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={16}
                        className={index < Math.round(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">{review.comment}</p>

                <div className="flex items-center gap-3">
                  {Array.isArray(product.images) && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name || "product"}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-700" />
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{product.name || "Product"}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{product.brand || product.category || ""}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center text-gray-500 dark:text-slate-400">
          No stored reviews found.
        </div>
      )}
    </section>
  );
}
