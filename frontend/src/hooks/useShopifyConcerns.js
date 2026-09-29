import { useEffect, useState } from "react";
import { getStorefrontContent } from "../services/storefrontContent";

const REFRESH_INTERVAL_MS = 15_000;

export default function useShopifyConcerns() {
  const [concerns, setConcerns] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      getStorefrontContent().then((content) => {
        if (active) setConcerns(content.concerns || []);
      });
    };

    refresh();
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refresh);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return concerns;
}
