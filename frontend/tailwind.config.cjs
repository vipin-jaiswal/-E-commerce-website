/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#ec4899",
        secondary: "#f9a8d4",
        dark: "#111827",
        gold: "#E6A500",
        border: "#EAE5E0",
      },
      animation: {
        marquee: "marquee 14s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(100vw)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};
