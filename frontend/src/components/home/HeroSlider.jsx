import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { bannerService } from '../../services/bannerService';

import "swiper/css";
import "swiper/css/navigation";

const HeroSlider = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    bannerService.listLive().then((items) => setBanners(Array.isArray(items) ? items : [])).catch(() => setBanners([]));
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1500px] px-4 -mt-4">
      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={banners.length > 1}
        className="aspect-[2/1] overflow-hidden rounded-3xl shadow-lg sm:aspect-[3/1] lg:aspect-[4/1] bg-card"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id} className="h-full">
            <img
              src={banner.image}
              alt={banner.title || 'Promotion banner'}
              onClick={() => banner.link && navigate(banner.link)}
              className="
                w-full
                h-full
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
