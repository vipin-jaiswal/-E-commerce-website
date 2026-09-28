/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-dark": "var(--color-primary-dark)",
        "primary-soft": "var(--color-primary-soft)",
        secondary: "#FFFFFF",
        dark: "var(--color-dark-bg)",
        charcoal: "var(--color-text)",
        foreground: "var(--color-text)",
        card: "var(--color-surface)",
        ivory: "var(--color-surface)",
        "ivory-dark": "var(--color-primary-soft)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        gold: "var(--color-primary)",
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
