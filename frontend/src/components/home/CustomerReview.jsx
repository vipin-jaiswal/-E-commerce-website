import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Vipin Jaiswal",
    date: "26 Jun 2026",
    title: "Absolutely love this!",
    description:
      "I've been using this for a few weeks now and my skin has never felt better. The glow is real! Highly recommend to anyone on the fence.",
    image:
      "/images/airpods.jpg",
  },
  {
    id: 2,
    name: "Rahul Sharma",
    date: "25 Jun 2026",
    title: "A Must-Have in My Routine",
    description:
      "This has become a staple in my daily skincare routine. It's lightweight, smells amazing, and I've noticed a significant reduction in blemishes.",
    image:
      "/images/iphone.jpg",
  },
  {
    id: 3,
    name: "Priya Singh",
    date: "24 Jun 2026",
    title: "Highly Recommended",
    description:
      "I was skeptical at first, but this product truly delivers on its promises. My hair feels stronger and looks so much healthier.",
    image:
      "/images/camera.jpg",
  },
  {
    id: 4,
    name: "Aman Verma",
    date: "23 Jun 2026",
    title: "Worth Every Penny",
    description:
      "A bit pricey, but a little goes a long way. The results are undeniable. My dark circles have visibly diminished.",
    image:
      "/images/playstation.jpg",
  },
  {
    id: 5,
    name: "Sneha Patel",
    date: "22 Jun 2026",
    title: "Excellent Quality",
    description:
      "The packaging is beautiful and the product itself is top-notch. It feels so luxurious on the skin and the results speak for themselves.",
    image:
      "/images/mouse.jpg",
  },
  {
    id: 6,
    name: "Riya Gupta",
    date: "21 Jun 2026",
    title: "Loved It!",
    description:
      "I'm obsessed! This is my second purchase and I'll keep coming back. It's gentle yet effective. My skin is glowing!",
    image:
      "/images/alexa.jpg",
  },
];

const CustomerReview = () => {
  const cardsPerSlide = 4;
  const totalSlides = Math.ceil(reviews.length / cardsPerSlide);

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev === totalSlides - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? totalSlides - 1 : prev - 1
    );
  };

  return (
    <section className="py-16 bg-gray-100">
      <div className="max-w-[1500px] mx-auto px-4 relative">

        <h2 className="text-3xl font-bold mb-8">
          What Our Customers Say
        </h2>

        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none"
        >
          <ChevronLeft size={40} />
        </button>

        {/* Slider */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
              <div
                key={slideIndex}
                className="min-w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {reviews
                  .slice(
                    slideIndex * cardsPerSlide,
                    slideIndex * cardsPerSlide + cardsPerSlide
                  )
                  .map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-500 rounded-xl p-4 text-black"
                    >
                      {/* Top */}
                      <div className="flex justify-between text-xs mb-2">
                        <span>{review.name}</span>
                        <span>{review.date}</span>
                      </div>

                      {/* Stars */}
                      <div className="flex gap-1 mb-3">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            size={18}
                            className="fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold mb-2">
                        {review.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm mb-5">
                        {review.description}
                      </p>

                      {/* Bottom */}
                      <div className="flex items-end gap-4">
                        <img
                          src={review.image}
                          alt="product"
                          className="w-10 h-16 object-contain"
                        />

                        <div>
                          <p className="font-medium text-sm">
                            {review.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none"
        >
          <ChevronRight size={40} />
        </button>

        {/* Indicators */}
        <div className="flex justify-center gap-3 mt-8">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "w-10 bg-black"
                  : "w-5 bg-gray-400"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default CustomerReview;
