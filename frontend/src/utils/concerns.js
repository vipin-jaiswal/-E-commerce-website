
import pigmentationImage from "../data/concerns/Pigmentation/pigmentation.jpg";
import acneImage from "../data/concerns/Acne/acne.jpg";
import dryskinimage from "../data/concerns/Dry Skin/dry skin.jpg";
import darkcirclesImage from "../data/concerns/Dark Circles/dark circle.jpg";
import SunburnImage from "../data/concerns/sun burn/Sunburn_Treatment_Practices.jpg";
import hairfallImage from "../data/concerns/Hair Fall/Hair fall.webp";

export const CONCERNS_DATA = {
  skin: [
    {
      name: "Acne",
      image: acneImage,
      query: "acne",
    },
    {
      name: "Pigmentation",
      image: pigmentationImage,
      query: "pigmentation",
    },
    {
      name: "Dry Skin",
      image: dryskinimage,
      query: "dry skin",
    },
    {
      name: "Dark Circles",
      image: darkcirclesImage,
      query: "dark circles",
    },
    {
      name: "Sun Burn",
      image: SunburnImage,
      query: "sunscreen",
    },
  ],
  hair: [
    {
      name: "Hair Fall",
      image: hairfallImage,
      query: "hair fall",
    },
  ],
};

export const ALL_CONCERNS = [...CONCERNS_DATA.skin, ...CONCERNS_DATA.hair];
