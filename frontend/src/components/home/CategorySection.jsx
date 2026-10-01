import ProductCard from "../product/ProductCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useProducts } from "../../hooks/useProducts";
import { ProductCardSkeleton } from "../common/Loader";
import { CATEGORIES } from "../../utils/constants";

import "swiper/css";
import "swiper/css/navigation";

function CategorySlider({ category }) {
  const isComingSoon = ["skin-care", "makeup"].includes(category.key);
  const { products, loading } = useProducts({
    category: category.key,
    limit: 8,
    enabled: !isComingSoon,
  });
  const [swiper, setSwiper] = useState(null);

  return (
    <div key={category.key} id={category.key} className="mb-24 scroll-mt-28">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">
          {category.label}
        </h3>

        <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
          {isComingSoon ? "Coming soon" : loading ? "Loading products..." : `${products.length} Products Available`}
        </p>
      </div>

      {isComingSoon ? (
        <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-white/10 dark:bg-slate-900">
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
            {category.label} products are coming soon.
          </p>
        </div>
      ) : <div
        className="relative px-0 sm:px-8"
        onMouseEnter={() => swiper?.autoplay.stop()}
        onMouseLeave={() => swiper?.autoplay.start()}
      >
        <button
          className={`category-prev-${category.key}
          absolute left-0 top-1/2 -translate-y-1/2 z-20
          hidden lg:flex items-center justify-center
          w-11 h-11 rounded-full bg-white text-slate-700 border border-slate-200 shadow-md
          hover:bg-primary hover:text-white
          dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none
          transition-all duration-300`}
        >
          <ChevronLeft size={22} />
        </button>

        <button
          className={`category-next-${category.key}
          absolute right-0 top-1/2 -translate-y-1/2 z-20
          hidden lg:flex items-center justify-center
          w-11 h-11 rounded-full bg-white text-slate-700 border border-slate-200 shadow-md
          hover:bg-primary hover:text-white
          dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none
          transition-all duration-300`}
        >
          <ChevronRight size={22} />
        </button>

        <Swiper
          onSwiper={setSwiper}
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: `.category-prev-${category.key}`,
            nextEl: `.category-next-${category.key}`,
          }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          loop={products.length > 5}
          speed={700}
          spaceBetween={12}
          breakpoints={{
            0: { slidesPerView: 2 },
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
          }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, index) => (
                <SwiperSlide key={index}>
                  <ProductCardSkeleton />
                </SwiperSlide>
              ))
            : products.map((product) => (
                <SwiperSlide key={product.id}>
                  <div className="mx-auto w-full max-w-[10.5rem] px-1 sm:max-w-[18rem] sm:px-0">
                    <ProductCard product={product} />
                  </div>
                </SwiperSlide>
              ))}
        </Swiper>
      </div>}

      <div className="flex justify-center mt-8">
        <Link
          to={isComingSoon ? "/products" : `/products/category/${category.key}`}
          aria-disabled={isComingSoon}
          onClick={(event) => isComingSoon && event.preventDefault()}
          className="ui-primary group flex items-center gap-2 px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base rounded-full shadow-md"
        >
          {isComingSoon ? `${category.label} Coming Soon` : `View All ${category.label} Products`}
          <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
        </Link>
      </div>
    </div>
  );
}

const CategorySection = () => {
  return (
    <section id="shop-by-category" className="scroll-mt-28 max-w-[1500px] mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-slate-100">
          Shop By Category
        </h2>

        <p className="text-gray-500 dark:text-slate-400 mt-3">
          Discover products from your favorite categories
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <CategorySlider key={category.key} category={category} />
      ))}

      <div className="flex justify-center mt-10">
        <Link to="/products" className="ui-outline border-2 rounded-full px-8 py-3 sm:px-10 sm:py-4 text-sm sm:text-base">
          View All Categories
        </Link>
      </div>
    </section>
  );
};

export default CategorySection;
