import ProductCard from "../product/ProductCard";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useProducts } from "../../hooks/useProducts";
import { ProductCardSkeleton } from "../common/Loader";
import { CATEGORIES } from "../../utils/constants";

import "swiper/css";
import "swiper/css/navigation";

function CategorySlider({ category }) {
  const { products, loading } = useProducts({ category: category.key, limit: 8 });

  return (
    <div key={category.key} id={category.key} className="mb-24 scroll-mt-28">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">
          {category.label}
        </h3>

        <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
          {loading ? "Loading products..." : `${products.length} Products Available`}
        </p>
      </div>

      <div className="relative px-8">
        <button
          className={`category-prev-${category.key}
          absolute left-0 top-1/2 -translate-y-1/2 z-20
          hidden lg:flex items-center justify-center
          w-11 h-11 rounded-full bg-white text-slate-700 border border-slate-200 shadow-md
          hover:bg-pink-500 hover:text-white
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
          hover:bg-pink-500 hover:text-white
          dark:bg-slate-900 dark:text-slate-100 dark:border-white/10 dark:shadow-none
          transition-all duration-300`}
        >
          <ChevronRight size={22} />
        </button>

        <Swiper
          modules={[Navigation, Autoplay]}
          navigation={{
            prevEl: `.category-prev-${category.key}`,
            nextEl: `.category-next-${category.key}`,
          }}
          autoplay={{
            delay: 3500,
            disableOnInteraction: false,
          }}
          loop={true}
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
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
        </Swiper>
      </div>

      <div className="flex justify-center mt-8">
        <button className="group flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 rounded-full font-semibold transition duration-300 shadow-md hover:shadow-lg">
          View All {category.label} Products
          <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
        </button>
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
        <button className="border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white px-10 py-4 rounded-full font-bold transition duration-300">
          View All Categories
        </button>
      </div>
    </section>
  );
};

export default CategorySection;
