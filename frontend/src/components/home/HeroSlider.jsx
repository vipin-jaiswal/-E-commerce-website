import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import { getStorefrontContent } from "../../services/storefrontContent";

const HeroSlider = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [contentLoaded, setContentLoaded] = useState(false);

  useEffect(() => {
    getStorefrontContent().then((content) => {
      setBanners((content.banners || []).filter((banner) => banner.image || banner.desktopImage || banner.mobileImage));
      setContentLoaded(true);
    });
  }, []);

  const openBannerLink = (link) => {
    if (!link) return;
    if (link.startsWith('/') && !link.startsWith('//')) {
      navigate(link);
      return;
    }
    window.location.assign(link);
  };

  if (contentLoaded && banners.length === 0) {
    return (
      <section className="mx-auto max-w-[1500px] px-4 -mt-4">
        <div className="flex aspect-[2/1] items-center justify-center rounded-3xl border border-dashed border-border bg-card text-sm text-muted sm:aspect-[3/1] lg:aspect-[4/1]">
          Banner is not available
        </div>
      </section>
    );
  }

  if (!contentLoaded) return null;

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
            <div className="relative h-full">
              <picture>
                <source
                  media="(max-width: 639px)"
                  srcSet={banner.mobileImage || banner.image || banner.desktopImage}
                />
                <img
                  src={banner.image || banner.desktopImage || banner.mobileImage}
                  alt={banner.heading || 'Promotion banner'}
                  onClick={() => openBannerLink(banner.link || banner.buttonUrl)}
                  className={`h-full w-full object-cover ${banner.link || banner.buttonUrl ? 'cursor-pointer' : ''}`}
                />
              </picture>
              {(banner.heading || banner.subtitle || banner.buttonText) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-5 pb-5 pt-14 text-white sm:px-10 sm:pb-8">
                  {banner.heading && <h2 className="text-xl font-bold sm:text-3xl">{banner.heading}</h2>}
                  {banner.subtitle && <p className="mt-1 max-w-xl text-sm text-white/90 sm:text-base">{banner.subtitle}</p>}
                  {banner.buttonText && banner.buttonUrl && (
                    <button
                      type="button"
                      onClick={() => openBannerLink(banner.link || banner.buttonUrl)}
                      className="ui-primary mt-4 rounded-full px-5 py-2 text-sm"
                    >
                      {banner.buttonText}
                    </button>
                  )}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroSlider;
