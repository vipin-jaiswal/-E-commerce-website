import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { banners } from "../../utils/banners";

import "swiper/css";
import "swiper/css/navigation";

const HeroSlider = () => {
  const navigate = useNavigate();

  return (
    <section className="max-w-[1500px] mx-auto px-4 -mt-4">
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
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
