import ProductCard from "../product/ProductCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useProducts } from "../../hooks/useProducts";
import { ProductCardSkeleton } from "../common/Loader";

import "swiper/css";
import "swiper/css/navigation";

const BestSellerSection = () => {
  const { products, loading } = useProducts({ limit: 8, sort: "best_seller" });

  return (
    <section id="best-sellers" className="scroll-mt-28 max-w-[1500px] mx-auto px-4 py-12">

      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-pink-500 uppercase tracking-[3px] text-xs font-semibold mb-1">
          Customer Favorites
        </p>

        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
          Best Sellers
        </h2>

        <p className="text-gray-500 mt-2 text-sm max-w-xl mx-auto">
          Discover our most loved products chosen by thousands of happy customers.
        </p>
      </div>

      {/* Slider Wrapper */}
      <div className="relative">

        {/* Left Arrow */}
        <button className="custom-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden lg:flex bg-white text-slate-700 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none">
          <ChevronLeft size={22} />
        </button>

        {/* Right Arrow */}
        <button className="custom-next absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden lg:flex bg-white text-slate-700 border border-slate-200 shadow-md dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none">
          <ChevronRight size={22} />
        </button>

        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: ".custom-prev",
            nextEl: ".custom-next",
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop={true}
          spaceBetween={12}
          breakpoints={{
            0: {
              slidesPerView: 2,
            },
            640: {
              slidesPerView: 3,
            },
            1024: {
              slidesPerView: 5,
            },
          }}
          className="px-10"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, index) => (
                <SwiperSlide key={index}>
                  <div className="px-1">
                    <ProductCardSkeleton />
                  </div>
                </SwiperSlide>
              ))
            : products.map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
        </Swiper>
      </div>

      {/* View All */}
      <div className="flex justify-center mt-8">
        <button className="group flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-semibold transition duration-300 shadow-md hover:shadow-lg">
          View All Products

          <ArrowRight
            size={18}
            className="group-hover:translate-x-1 transition"
          />
        </button>
      </div>

    </section>
  );
};

export default BestSellerSection;
