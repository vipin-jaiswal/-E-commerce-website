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
      },
    },
  },
  plugins: [],
};
