import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

const HeroSlider = () => {
  const navigate = useNavigate();

  const banners = [
    {
      id: 1,
      image: "/banners/banner1.png",
      link: "/products/skincare",
    },
    {
      id: 2,
      image: "/banners/banner2.png",
      link: "/products/perfume",
    },
    {
      id: 3,
      image: "/banners/banner3.png",
      link: "/products/haircare",
    },
  ];

  return (
    <section className="max-w-[1500px] mx-auto px-4 py-6">
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="rounded-3xl overflow-hidden shadow-lg"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <img
              src={banner.image}
              alt={`Banner ${banner.id}`}
              onClick={() => navigate(banner.link)}
              className="
                w-full
                h-[220px]
                md:h-[350px]
                lg:h-[450px]
                object-cover
                cursor-pointer
              "
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroSlider;