import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import { ProductCardSkeleton } from './Loader';

import 'swiper/css';
import 'swiper/css/navigation';

export default function ProductSlider({ products, loading, loop = false, slidesPerView = 5 }) {
  const [swiper, setSwiper] = useState(null);
  const uniqueId = React.useId();

  const navigation = {
    prevEl: `.custom-prev-${uniqueId}`,
    nextEl: `.custom-next-${uniqueId}`,
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => swiper?.autoplay.stop()}
      onMouseLeave={() => swiper?.autoplay.start()}
    >
      <button
        className={`
          ${navigation.prevEl.slice(1)}
          absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2
          z-20 hidden lg:flex items-center justify-center
          w-11 h-11 rounded-full 
          bg-card shadow-lg border border-border text-foreground
          hover:bg-primary hover:text-primary-foreground
          transition duration-300
        `}
      >
        <ChevronLeft size={22} />
      </button>

      <button
        className={`
          ${navigation.nextEl.slice(1)}
          absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
          z-20 hidden lg:flex items-center justify-center
          w-11 h-11 rounded-full
          bg-card shadow-lg border border-border text-foreground
          hover:bg-primary hover:text-primary-foreground
          transition duration-300
        `}
      >
        <ChevronRight size={22} />
      </button>

      <Swiper
        onSwiper={setSwiper}
        modules={[Navigation, Autoplay]}
        navigation={navigation}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        speed={700}
        loop={loop}
        spaceBetween={12}
        breakpoints={{
          0: { slidesPerView: 2 },
          640: { slidesPerView: 3 },
          1024: { slidesPerView: slidesPerView },
        }}
        className="px-2"
      >
        {loading ? (
          Array.from({ length: slidesPerView }).map((_, index) => (
            <SwiperSlide key={index}>
              <ProductCardSkeleton />
            </SwiperSlide>
          ))
        ) : products?.length > 0 ? (
          products.map((product) => (
            <SwiperSlide key={product._id || product.id}>
              <ProductCard product={product} />
            </SwiperSlide>
          ))
        ) : (
          <div className="text-center py-10 text-muted-foreground col-span-full">No products found</div>
        )}
      </Swiper>
    </div>
  );
}