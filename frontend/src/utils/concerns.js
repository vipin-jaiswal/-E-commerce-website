export const CONCERNS_DATA = {
  skin: [
    {
      name: "Acne",
      image: "/concerns/acne.jpg",
      query: "acne",
    },
    {
      name: "Pigmentation",
      image: "/concerns/pigmentation.jpg",
      query: "pigmentation",
    },
    {
      name: "Dry Skin",
      image: "/concerns/dryskin.jpg",
      query: "dry skin",
    },
    {
      name: "Dark Circles",
      image: "/concerns/darkcircles.jpg",
      query: "dark circles",
    },
    {
      name: "Anti Aging",
      image: "/concerns/antiaging.jpg",
      query: "anti-aging",
    },
  ],
  hair: [
    {
      name: "Hair Fall",
      image: "/concerns/hairfall.jpg",
      query: "hair fall",
    },
  ],
};

export const ALL_CONCERNS = [...CONCERNS_DATA.skin, ...CONCERNS_DATA.hair];