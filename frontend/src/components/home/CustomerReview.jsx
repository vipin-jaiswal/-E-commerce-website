import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import api from "../../services/api";

const normalizeReview = (review) => ({
  ...review,
  id: review.id || review._id,
  productId: review.productId || review.product?._id || review.product?.id || review.product,
  product: review.product && typeof review.product === "object" ? review.product : null,
});

const CustomerReview = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const cardsPerSlide = 4;
  const totalSlides = useMemo(
    () => Math.max(1, Math.ceil(reviews.length / cardsPerSlide)),
    [reviews.length]
  );

  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  return (
    <section className="py-16 bg-gray-100 dark:bg-black">
      <div className="max-w-[1500px] mx-auto px-4 relative">
        <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-slate-100">What Our Customers Say</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">Fetched live from the reviews collection.</p>

        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 border border-slate-200 shadow-md dark:bg-slate-800 dark:text-slate-100 dark:border-white/10 dark:shadow-none"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {loading ? (
              <div className="min-w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm animate-pulse">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
                    <div className="h-24 bg-gray-100 dark:bg-slate-700 rounded mb-4" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : reviews.length > 0 ? (
              Array.from({ length: totalSlides }).map((_, slideIndex) => {
                const slideReviews = reviews.slice(
                  slideIndex * cardsPerSlide,
                  slideIndex * cardsPerSlide + cardsPerSlide
                );

                return (
                  <div
                    key={slideIndex}
                    className="min-w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {slideReviews.map((review) => {
                      const product = review.product || {};
                      const image = Array.isArray(product.images) && product.images.length
                        ? product.images[0]
                        : null;

                      return (
                        <div
                          key={review.id}
                          className="rounded-2xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200"
                        >
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span className="font-semibold text-gray-700 dark:text-slate-300">{review.userName}</span>
                            <span className="dark:text-slate-400">
                              {review.createdAt
                                ? new Date(review.createdAt).toLocaleDateString()
                                : ""}
                            </span>
                          </div>

                          <div className="flex gap-1 mb-3">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={16}
                                className={index < Math.round(review.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>

                          <h3 className="text-base font-semibold mb-2 dark:text-white">
                            {product.name || "Product review"}
                          </h3>

                          <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 line-clamp-4">
                            {review.comment}
                          </p>

                          <div className="flex items-center gap-3">
                            {image ? (
                              <img
                                src={image}
                                alt={product.name || "product"}
                                className="w-12 h-12 object-cover rounded-lg bg-gray-100"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-50 to-slate-100" />
                            )}

                            <div>
                              <p className="text-sm font-medium dark:text-slate-300">{product.brand || "Verified buyer"}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">{product.category || "From backend data"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="min-w-full py-12 text-center text-gray-500">
                No reviews found
              </div>
            )}
          </div>
        </div>

        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 border border-slate-200 shadow-md dark:bg-slate-800 dark:text-slate-100 dark:border-white/10 dark:shadow-none"
        >
          <ChevronRight size={24} />
        </button>

        <div className="flex justify-center gap-3 mt-8">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === index ? "w-10 bg-black dark:bg-white" : "w-5 bg-gray-400 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReview;
