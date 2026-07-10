import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeroSlider from "../components/home/HeroSlider";
import BestSellerSection from "../components/home/BestSellerSection";
import ShopByConcern from "../components/home/ShopByConcern";
import CategorySection from "../components/home/CategorySection";
import CustomerReview from "../components/home/CustomerReview";

const Home = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [hash]);

  return (
    <main>
      <HeroSlider />

      <BestSellerSection />
      <ShopByConcern />

      <CategorySection />
      <CustomerReview />
    </main>
  );
};

export default Home;
